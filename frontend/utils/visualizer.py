import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

def create_risk_gauge(risk_score: float):
    """Generates a gauge chart for the risk score."""
    val = risk_score * 100
    fig = go.Figure(go.Indicator(
        mode = "gauge+number",
        value = val,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Risk Score", 'font': {'size': 20, 'color': '#F8FAFC'}},
        number = {'suffix': "%", 'font': {'color': '#F8FAFC'}},
        gauge = {
            'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "white"},
            'bar': {'color': "rgba(255, 255, 255, 0.4)"},
            'bgcolor': "#1E293B",
            'borderwidth': 0,
            'steps': [
                {'range': [0, 40], 'color': "#10B981"}, # Green
                {'range': [40, 70], 'color': "#F59E0B"}, # Orange
                {'range': [70, 100], 'color': "#EF4444"}], # Red
            'threshold': {
                'line': {'color': "white", 'width': 4},
                'thickness': 0.75,
                'value': val}}))
    
    fig.update_layout(
        height=250, 
        margin=dict(l=20, r=20, t=40, b=20), 
        paper_bgcolor="rgba(0,0,0,0)",
        font={'color': "#ffffff"}
    )
    return fig

def create_shap_bar(shap_data: list):
    """Generates a bar chart showing feature importance/impact based on SHAP values."""
    if not shap_data:
        return go.Figure()
        
    labels = [item['feature'] for item in shap_data]
    impact = [item['contribution'] for item in shap_data]
    colors = ['#EF4444' if val > 0 else '#10B981' for val in impact]
    
    # Sort by absolute impact
    sorted_idx = np.argsort(np.abs(impact))
    labels = [labels[i] for i in sorted_idx]
    impact = [impact[i] for i in sorted_idx]
    colors = [colors[i] for i in sorted_idx]

    fig = go.Figure(go.Bar(
        x=impact,
        y=labels,
        orientation='h',
        marker_color=colors
    ))
    
    fig.update_layout(
        title="SHAP Feature Explanations (Red = Increases Risk, Green = Decreases Risk)",
        xaxis_title="SHAP Value (Impact on Risk)", 
        yaxis_title="Feature", 
        height=350, 
        paper_bgcolor="rgba(0,0,0,0)", 
        plot_bgcolor="rgba(0,0,0,0)",
        font={'color': "#ffffff"},
        xaxis=dict(showgrid=True, gridcolor='rgba(0, 212, 255, 0.2)'),
        yaxis=dict(showgrid=False)
    )
    return fig

def create_trend_chart(trend_data: list = None):
    """Generates a line chart for fraud trends over time."""
    if trend_data and len(trend_data) > 0:
        dates = [item["timestamp"] for item in trend_data]
        fraud_cases = [item["count"] for item in trend_data]
        title = "Live Fraud Trends (Alerts per minute)"
    else:
        dates = pd.date_range(end=pd.Timestamp.today(), periods=14, freq='D')
        fraud_cases = np.random.randint(2, 15, size=14)
        title = "Fraud Trends (Last 14 Days) - Simulated"
    
    fig = px.area(
        x=dates, 
        y=fraud_cases, 
        title=title,
        markers=True,
        color_discrete_sequence=['#00d4ff']
    )
    
    # Add a gradient fill to the area chart
    fig.update_traces(fill='tozeroy', fillcolor='rgba(0, 212, 255, 0.1)')

    fig.update_layout(
        xaxis_title="", 
        yaxis_title="Alerts Triggered", 
        height=300, 
        paper_bgcolor="rgba(0,0,0,0)", 
        plot_bgcolor="rgba(0,0,0,0)",
        font={'color': "#ffffff"},
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor='rgba(0, 212, 255, 0.2)')
    )
    return fig
