from fastapi import FastAPI, HTTPException, Query
from fastapi.openapi.docs import (
    get_redoc_html,
    get_swagger_ui_html,
    get_swagger_ui_oauth2_redirect_html,
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import pandas as pd
from io import StringIO, BytesIO
from pathlib import Path
import os
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import base64

app = FastAPI(docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create directories for reports and visualizations if they don't exist
# Create directories for reports and visualizations if they don't exist
REPORTS_DIR = Path("reports")
MRO_DIR = REPORTS_DIR / "mro"
ES_DIR = REPORTS_DIR / "es"
VISUALIZATIONS_DIR = Path("visualizations")

REPORTS_DIR.mkdir(exist_ok=True)
MRO_DIR.mkdir(exist_ok=True)
ES_DIR.mkdir(exist_ok=True)
VISUALIZATIONS_DIR.mkdir(exist_ok=True)

# Mount visualizations directory to serve images
app.mount("/visualizations", StaticFiles(directory="visualizations"), name="visualizations")

# Base URL for accessing the API from external services
# Change this to your actual host when deploying
BASE_URL = os.getenv("BASE_URL", "http://172.16.28.63:8001")


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )


@app.get(app.swagger_ui_oauth2_redirect_url, include_in_schema=False)
async def swagger_ui_redirect():
    return get_swagger_ui_oauth2_redirect_html()


@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - ReDoc",
        redoc_js_url="/static/redoc.standalone.js",
    )


@app.get("/files/list")
async def list_files(directory: str = Query(None, description="Optional directory path. If not provided, lists files in current directory")):
    try:
        target_dir = Path(directory) if directory else Path.cwd()
        
        if not target_dir.exists():
            raise HTTPException(status_code=404, detail=f"Directory not found: {target_dir}")
        
        if not target_dir.is_dir():
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {target_dir}")
        
        items = []
        for item in target_dir.iterdir():
            items.append({
                "name": item.name,
                "path": str(item),
                "is_file": item.is_file(),
                "is_dir": item.is_dir(),
                "size": item.stat().st_size if item.is_file() else None,
                "extension": item.suffix if item.is_file() else None
            })
        
        items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        
        return {
            "current_directory": str(target_dir),
            "total_items": len(items),
            "files": [item for item in items if item["is_file"]],
            "directories": [item for item in items if item["is_dir"]],
            "all_items": items
        }
    
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied to access directory")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")


@app.get("/dataframe/info")
async def get_dataframe_info(file_path: str = Query(..., description="Path to CSV file")):
    try:
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        df = pd.read_csv(file_path)
        
        buffer = StringIO()
        df.info(buf=buffer)
        info_str = buffer.getvalue()
        
        return {
            "file_path": file_path,
            "info": info_str,
            "shape": list(df.shape),
            "columns": list(df.columns),
            "dtypes": {str(k): str(v) for k, v in df.dtypes.items()}
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/kpi/visualize")
async def visualize_kpi_data(
    file_path: str = Query(..., description="Path to CSV file with KPI data"),
    kpi_columns: str = Query(None, description="Comma-separated list of KPI columns to visualize. If not provided, all numeric columns will be used"),
    base_url: str = Query(None, description="Base URL for accessing visualizations. Defaults to BASE_URL env variable or http://172.16.28.63:8001")
):
    """
    Generate visualizations for 5G KPI data and return paths to the generated images.
    """
    try:
        # Use provided base_url or fall back to global BASE_URL
        url_base = base_url if base_url else BASE_URL
        
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        df = pd.read_csv(file_path)
        
        # Identify numeric columns (KPIs)
        if kpi_columns:
            selected_columns = [col.strip() for col in kpi_columns.split(',')]
            numeric_cols = [col for col in selected_columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        else:
            numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns.tolist()
        
        if not numeric_cols:
            raise HTTPException(status_code=400, detail="No numeric KPI columns found in the data")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_paths = []
        
        # 1. Time series plot for all KPIs
        plt.figure(figsize=(14, 8))
        for col in numeric_cols:
            plt.plot(df.index, df[col], marker='o', label=col, linewidth=2)
        plt.xlabel('Index', fontsize=12)
        plt.ylabel('KPI Values', fontsize=12)
        plt.title('5G KPI Time Series', fontsize=14, fontweight='bold')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        timeseries_path = VISUALIZATIONS_DIR / f"kpi_timeseries_{timestamp}.png"
        plt.savefig(timeseries_path, dpi=300, bbox_inches='tight')
        plt.close()
        image_paths.append(str(timeseries_path))
        
        # 2. Box plots for KPI distribution
        plt.figure(figsize=(14, 8))
        df[numeric_cols].boxplot(rot=45, fontsize=10)
        plt.title('5G KPI Distribution', fontsize=14, fontweight='bold')
        plt.ylabel('Values', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        boxplot_path = VISUALIZATIONS_DIR / f"kpi_boxplot_{timestamp}.png"
        plt.savefig(boxplot_path, dpi=300, bbox_inches='tight')
        plt.close()
        image_paths.append(str(boxplot_path))
        
        # 3. Correlation heatmap
        heatmap_path = None
        if len(numeric_cols) > 1:
            plt.figure(figsize=(12, 10))
            correlation_matrix = df[numeric_cols].corr()
            sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm', 
                       center=0, square=True, linewidths=1, cbar_kws={"shrink": 0.8})
            plt.title('KPI Correlation Heatmap', fontsize=14, fontweight='bold')
            plt.tight_layout()
            
            heatmap_path = VISUALIZATIONS_DIR / f"kpi_heatmap_{timestamp}.png"
            plt.savefig(heatmap_path, dpi=300, bbox_inches='tight')
            plt.close()
            image_paths.append(str(heatmap_path))
        
        # 4. Individual KPI histograms
        n_cols = min(3, len(numeric_cols))
        n_rows = (len(numeric_cols) + n_cols - 1) // n_cols
        
        fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 5 * n_rows))
        if n_rows == 1 and n_cols == 1:
            axes = [[axes]]
        elif n_rows == 1 or n_cols == 1:
            axes = axes.reshape(n_rows, n_cols)
        
        for idx, col in enumerate(numeric_cols):
            row = idx // n_cols
            col_idx = idx % n_cols
            ax = axes[row][col_idx]
            
            ax.hist(df[col].dropna(), bins=30, edgecolor='black', alpha=0.7)
            ax.set_title(f'{col} Distribution', fontsize=11, fontweight='bold')
            ax.set_xlabel('Value', fontsize=10)
            ax.set_ylabel('Frequency', fontsize=10)
            ax.grid(True, alpha=0.3)
        
        # Hide empty subplots
        for idx in range(len(numeric_cols), n_rows * n_cols):
            row = idx // n_cols
            col_idx = idx % n_cols
            fig.delaxes(axes[row][col_idx])
        
        plt.tight_layout()
        histogram_path = VISUALIZATIONS_DIR / f"kpi_histograms_{timestamp}.png"
        plt.savefig(histogram_path, dpi=300, bbox_inches='tight')
        plt.close()
        image_paths.append(str(histogram_path))
        
        visualizations = [
            {
                "type": "timeseries",
                "path": str(timeseries_path),
                "url": f"{url_base}/visualizations/{timeseries_path.name}"
            },
            {
                "type": "boxplot",
                "path": str(boxplot_path),
                "url": f"{url_base}/visualizations/{boxplot_path.name}"
            },
        ]
        
        if heatmap_path:
            visualizations.append({
                "type": "heatmap",
                "path": str(heatmap_path),
                "url": f"{url_base}/visualizations/{heatmap_path.name}"
            })
        
        visualizations.append({
            "type": "histograms",
            "path": str(histogram_path),
            "url": f"{url_base}/visualizations/{histogram_path.name}"
        })
        
        return {
            "status": "success",
            "timestamp": timestamp,
            "kpi_columns": numeric_cols,
            "base_url": url_base,
            "visualizations": visualizations
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error visualizing KPI data: {str(e)}")


@app.post("/kpi/report")
async def generate_kpi_report(
    file_path: str = Query(..., description="Path to CSV file with KPI data"),
    report_title: str = Query("5G KPI Analysis Report", description="Title for the report"),
    report_type: str = Query("mro", description="Type of report: 'mro' or 'es'"),
    kpi_columns: str = Query(None, description="Comma-separated list of KPI columns to analyze"),
    base_url: str = Query(None, description="Base URL for accessing visualizations. Defaults to BASE_URL env variable or http://172.16.28.63:8001")
):

    """
    Generate a comprehensive markdown report with KPI analysis and visualizations.
    Returns the markdown content directly along with metadata.
    """
    try:
        # Use provided base_url or fall back to global BASE_URL
        url_base = base_url if base_url else BASE_URL
        
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        df = pd.read_csv(file_path)
        
        # Get numeric columns
        if kpi_columns:
            selected_columns = [col.strip() for col in kpi_columns.split(',')]
            numeric_cols = [col for col in selected_columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        else:
            numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns.tolist()
        
        if not numeric_cols:
            raise HTTPException(status_code=400, detail="No numeric KPI columns found")
        
        # Generate visualizations first with absolute URLs
        viz_result = await visualize_kpi_data(file_path=file_path, kpi_columns=kpi_columns, base_url=url_base)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Calculate statistics
        stats_df = df[numeric_cols].describe()
        
        # Build markdown report
        markdown_content = f"""# {report_title}

**Generated:** {timestamp}  
**Data Source:** `{file_path}`  
**Total Records:** {len(df)}  
**KPIs Analyzed:** {len(numeric_cols)}

---

## 1. Executive Summary

This report presents a comprehensive analysis of 5G KPI data containing {len(df)} records across {len(numeric_cols)} key performance indicators.

### Key Metrics Analyzed:
"""
        
        for col in numeric_cols:
            markdown_content += f"- {col}\n"
        
        markdown_content += f"""
---

## 2. Data Overview

### Dataset Information
- **Shape:** {df.shape[0]} rows × {df.shape[1]} columns
- **Date Range:** {df.index[0]} to {df.index[-1]} (by index)
- **Missing Values:** {df[numeric_cols].isnull().sum().sum()} total

### Column Data Types
"""
        
        for col in df.columns:
            markdown_content += f"- **{col}:** {df[col].dtype}\n"
        
        markdown_content += """
---

## 3. Statistical Summary

"""
        
        # Add statistics table
        markdown_content += "| Metric | " + " | ".join(numeric_cols) + " |\n"
        markdown_content += "|" + "---|" * (len(numeric_cols) + 1) + "\n"
        
        for stat in ['mean', 'std', 'min', '25%', '50%', '75%', 'max']:
            row_values = [f"{stats_df.loc[stat, col]:.2f}" for col in numeric_cols]
            markdown_content += f"| **{stat}** | " + " | ".join(row_values) + " |\n"
        
        markdown_content += """
---

## 4. Visualizations

### 4.1 Time Series Analysis
"""
        
        # Add time series plot with ABSOLUTE URL
        timeseries_viz = [v for v in viz_result['visualizations'] if v and v['type'] == 'timeseries'][0]
        markdown_content += f"\n![KPI Time Series]({timeseries_viz['url']})\n\n"
        markdown_content += "The time series plot shows the trend of all KPIs over the observation period.\n\n"
        
        markdown_content += "### 4.2 Distribution Analysis\n\n"
        
        # Add box plot with ABSOLUTE URL
        boxplot_viz = [v for v in viz_result['visualizations'] if v and v['type'] == 'boxplot'][0]
        markdown_content += f"![KPI Box Plots]({boxplot_viz['url']})\n\n"
        markdown_content += "Box plots reveal the distribution, median, and outliers for each KPI.\n\n"
        
        # Add histograms with ABSOLUTE URL
        histogram_viz = [v for v in viz_result['visualizations'] if v and v['type'] == 'histograms'][0]
        markdown_content += f"![KPI Histograms]({histogram_viz['url']})\n\n"
        markdown_content += "Histograms show the frequency distribution of values for each KPI.\n\n"
        
        # Add heatmap if available with ABSOLUTE URL
        if len(numeric_cols) > 1:
            markdown_content += "### 4.3 Correlation Analysis\n\n"
            heatmap_viz = [v for v in viz_result['visualizations'] if v and v['type'] == 'heatmap'][0]
            markdown_content += f"![KPI Correlation Heatmap]({heatmap_viz['url']})\n\n"
            markdown_content += "The correlation heatmap shows relationships between different KPIs. Strong positive correlations appear in red, while negative correlations appear in blue.\n\n"
        
        markdown_content += """
---

## 5. Key Findings

"""
        
        # Add insights for each KPI
        for col in numeric_cols:
            mean_val = df[col].mean()
            std_val = df[col].std()
            min_val = df[col].min()
            max_val = df[col].max()
            
            markdown_content += f"""### {col}
- **Average:** {mean_val:.2f}
- **Standard Deviation:** {std_val:.2f}
- **Range:** {min_val:.2f} to {max_val:.2f}
- **Coefficient of Variation:** {(std_val/mean_val*100):.2f}%

"""
        
        markdown_content += """
---

## 6. Recommendations

Based on the analysis:

1. Monitor KPIs that show high variability or unexpected trends
2. Investigate any outliers identified in the box plots
3. Consider the correlations between KPIs when optimizing network performance
4. Track time-based trends to identify patterns or degradation

---

**Report End**

*Generated automatically by 5G KPI Analysis System*
"""
        
        # Save report
        # Save report
        report_filename = f"kpi_report_{report_timestamp}.md"
        
        # Select directory based on type
        target_dir = ES_DIR if report_type.lower() == "es" else MRO_DIR
        report_path = target_dir / report_filename
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        return {
            "status": "success",
            "report_path": str(report_path),
            "report_filename": report_filename,
            "report_type": report_type,
            "report_url": f"{url_base}/network-manager/reports/download/{report_type}/{report_filename}",
            "markdown_content": markdown_content,
            "timestamp": timestamp,
            "kpi_count": len(numeric_cols),
            "record_count": len(df),
            "base_url": url_base,
            "visualizations": viz_result['visualizations']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.get("/network-manager/reports/download/{report_type}/{filename}")
async def download_report(report_type: str, filename: str):
    """
    Download a generated markdown report.
    """
    target_dir = ES_DIR if report_type.lower() == "es" else MRO_DIR
    report_path = target_dir / filename
    
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=report_path,
        media_type='text/markdown',
        filename=filename
    )


@app.get("/network-manager/reports/list")
async def list_reports(type: str = Query("mro", description="Report type: 'mro' or 'es'")):
    """
    List all generated reports for a specific type.
    """
    try:
        reports = []
        target_dir = ES_DIR if type.lower() == "es" else MRO_DIR
        
        for report_file in target_dir.glob("*.md"):
            reports.append({
                "filename": report_file.name,
                "path": str(report_file),
                "type": type,
                "size": report_file.stat().st_size,
                "created": datetime.fromtimestamp(report_file.stat().st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
                "download_url": f"{BASE_URL}/network-manager/reports/download/{type}/{report_file.name}"
            })
        
        reports.sort(key=lambda x: x['created'], reverse=True)
        
        return {
            "total_reports": len(reports),
            "reports": reports
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing reports: {str(e)}")


@app.get("/visualizations/list")
async def list_visualizations():
    """
    List all generated visualization images.
    """
    try:
        visualizations = []
        for viz_file in VISUALIZATIONS_DIR.glob("*.png"):
            visualizations.append({
                "filename": viz_file.name,
                "path": str(viz_file),
                "size": viz_file.stat().st_size,
                "created": datetime.fromtimestamp(viz_file.stat().st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
                "url": f"{BASE_URL}/visualizations/{viz_file.name}"
            })
        
        visualizations.sort(key=lambda x: x['created'], reverse=True)
        
        return {
            "total_visualizations": len(visualizations),
            "visualizations": visualizations
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing visualizations: {str(e)}")