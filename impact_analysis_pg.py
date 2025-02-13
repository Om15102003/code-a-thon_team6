import psycopg2
from psycopg2.extras import DictCursor
import pandas as pd
from tabulate import tabulate
from typing import Dict, List
from datetime import datetime, date
import os

EXCEL_FILE = 'impact_analysis.xlsx'

def connect_to_db():
    """Establish database connection"""
    return psycopg2.connect(
        dbname="employee_system",
        user="postgres",
        password="Omg$15102003",  # Replace with your PostgreSQL password
        host="localhost"
    )

def export_to_excel(projects: List[Dict]):
    """Export project data to Excel with matrix format"""
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
        # Create summary sheet
        summary_data = {
            'Project Name': [p['name'] for p in projects],
            'Analysis Date': [p['date'] for p in projects]
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        # Create individual project sheets
        for project in projects:
            # Create sheet name (remove special characters)
            sheet_name = f"{project['name'][:30]}"  # Limit length for Excel compatibility
            
            # Convert impact table to DataFrame
            df = pd.DataFrame(
                project['impact_table'],
                columns=['Impact Type', '24hr', '48hr', '72hr', '1Week']
            )
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # Add project metadata
            metadata = pd.DataFrame({
                'Metadata': ['Analysis Date'],
                'Value': [project['date']]
            })
            metadata.to_excel(writer, sheet_name=sheet_name, startrow=6, index=False)
    
    print(f"Data exported to {EXCEL_FILE}")

def fetch_project_impacts() -> List[Dict]:
    """Fetch impact analysis data from PostgreSQL"""
    conn = connect_to_db()
    cur = conn.cursor(cursor_factory=DictCursor)
    
    try:
        # Get all projects
        cur.execute("""
            SELECT 
                ImpactID,
                Name,
                FI24, FI48, FI72, FI1W,
                OI24, OI48, OI72, OI1W,
                AnalysisDate
            FROM 
                ImpactAnalysis
            ORDER BY 
                AnalysisDate DESC
        """)
        
        results = cur.fetchall()
        
        projects = []
        for row in results:
            # Create impact tables for Financial and Operational impacts
            impact_table = [
                ['Financial', 
                 row['FI24'],
                 row['FI48'],
                 row['FI72'],
                 row['FI1W']],
                ['Operational',
                 row['OI24'],
                 row['OI48'],
                 row['OI72'],
                 row['OI1W']],
                ['Max Impact',
                 max(row['FI24'], row['OI24']),
                 max(row['FI48'], row['OI48']),
                 max(row['FI72'], row['OI72']),
                 max(row['FI1W'], row['OI1W'])]
            ]
            
            project = {
                'name': row['Name'],
                'date': row['AnalysisDate'].strftime('%Y-%m-%d') if row['AnalysisDate'] else 'N/A',
                'impact_table': impact_table
            }
            projects.append(project)
        
        return projects
        
    finally:
        cur.close()
        conn.close()

def display_project_impacts(export=False):
    """Display impact analysis and optionally export to Excel"""
    try:
        projects = fetch_project_impacts()
        
        print("\nProject Impact Analysis Report")
        print("=" * 80)
        
        for project in projects:
            print(f"\nProject: {project['name']}")
            print(f"Analysis Date: {project['date']}")
            print("-" * 60)
            
            print(tabulate(
                project['impact_table'],
                headers=['Impact Type', '24hr', '48hr', '72hr', '1Week'],
                tablefmt="grid",
                stralign="center"
            ))
            print()  # Add blank line between projects
        
        if export:
            export_to_excel(projects)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    display_project_impacts(export=True)
