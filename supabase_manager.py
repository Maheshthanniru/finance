"""
Supabase Database Manager
This script allows you to connect to Supabase and manage your database tables.
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables from .env.local or .env
load_dotenv('.env.local')
load_dotenv('.env')

class SupabaseManager:
    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Missing Supabase credentials. Please set:\n"
                "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL\n"
                "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY\n"
                "in your .env.local or .env file"
            )
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"✅ Connected to Supabase: {self.supabase_url}")
    
    def get_all_tables(self) -> List[str]:
        """
        Get all table names from the database.
        Note: This uses the REST API to query information_schema.
        """
        try:
            # Query information_schema to get all tables
            # Using RPC call or direct query if available
            response = self.client.rpc('get_all_tables').execute()
            return response.data if response.data else []
        except Exception as e:
            # Fallback: return known tables from schema
            print(f"⚠️  Could not query information_schema: {e}")
            print("📋 Using known tables from schema:")
            known_tables = [
                'partners',
                'customers',
                'loans',
                'transactions',
                'installments'
            ]
            return known_tables
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get information about a specific table"""
        try:
            # Try to get a sample row to understand structure
            response = self.client.table(table_name).select("*").limit(1).execute()
            
            if response.data and len(response.data) > 0:
                columns = list(response.data[0].keys())
                return {
                    'table_name': table_name,
                    'columns': columns,
                    'sample_row': response.data[0] if response.data else None,
                    'row_count': self.get_table_count(table_name)
                }
            else:
                # Table exists but is empty
                return {
                    'table_name': table_name,
                    'columns': [],
                    'sample_row': None,
                    'row_count': 0
                }
        except Exception as e:
            return {
                'table_name': table_name,
                'error': str(e)
            }
    
    def get_table_count(self, table_name: str) -> int:
        """Get the number of rows in a table"""
        try:
            response = self.client.table(table_name).select("*", count="exact").execute()
            return response.count if hasattr(response, 'count') else len(response.data)
        except Exception as e:
            print(f"⚠️  Error getting count for {table_name}: {e}")
            return 0
    
    def list_all_tables_with_info(self) -> Dict[str, Any]:
        """List all tables with their information"""
        tables = self.get_all_tables()
        result = {
            'total_tables': len(tables),
            'tables': {}
        }
        
        print(f"\n📊 Found {len(tables)} tables:\n")
        
        for table in tables:
            print(f"📋 Analyzing table: {table}...")
            info = self.get_table_info(table)
            result['tables'][table] = info
            
            if 'error' not in info:
                print(f"   ✅ Columns: {len(info['columns'])} | Rows: {info['row_count']}")
            else:
                print(f"   ❌ Error: {info['error']}")
        
        return result
    
    def query_table(self, table_name: str, filters: Optional[Dict] = None, limit: int = 100) -> List[Dict]:
        """Query data from a table"""
        try:
            query = self.client.table(table_name).select("*")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            response = query.limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"❌ Error querying {table_name}: {e}")
            return []
    
    def insert_data(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into a table"""
        try:
            response = self.client.table(table_name).insert(data).execute()
            print(f"✅ Inserted data into {table_name}")
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"❌ Error inserting into {table_name}: {e}")
            raise
    
    def update_data(self, table_name: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict]:
        """Update data in a table"""
        try:
            query = self.client.table(table_name).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            print(f"✅ Updated data in {table_name}")
            return response.data
        except Exception as e:
            print(f"❌ Error updating {table_name}: {e}")
            raise
    
    def delete_data(self, table_name: str, filters: Dict[str, Any]) -> List[Dict]:
        """Delete data from a table"""
        try:
            query = self.client.table(table_name).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            print(f"✅ Deleted data from {table_name}")
            return response.data
        except Exception as e:
            print(f"❌ Error deleting from {table_name}: {e}")
            raise
    
    def export_table_to_json(self, table_name: str, filename: Optional[str] = None) -> str:
        """Export a table to JSON file"""
        data = self.query_table(table_name, limit=10000)
        
        if filename is None:
            filename = f"{table_name}_export.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"✅ Exported {len(data)} rows from {table_name} to {filename}")
        return filename


def main():
    """Main function to demonstrate usage"""
    try:
        # Initialize manager
        manager = SupabaseManager()
        
        # Get all tables with information
        print("\n" + "="*60)
        print("📊 SUPABASE DATABASE MANAGER")
        print("="*60)
        
        tables_info = manager.list_all_tables_with_info()
        
        # Print detailed information
        print("\n" + "="*60)
        print("📋 DETAILED TABLE INFORMATION")
        print("="*60)
        
        for table_name, info in tables_info['tables'].items():
            print(f"\n📊 Table: {table_name}")
            if 'error' not in info:
                print(f"   Columns ({len(info['columns'])}): {', '.join(info['columns'][:10])}")
                if len(info['columns']) > 10:
                    print(f"   ... and {len(info['columns']) - 10} more")
                print(f"   Row count: {info['row_count']}")
            else:
                print(f"   ❌ Error: {info['error']}")
        
        # Export summary to JSON
        summary_file = "supabase_tables_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(tables_info, f, indent=2, default=str)
        
        print(f"\n✅ Summary exported to {summary_file}")
        print("\n" + "="*60)
        print("💡 You can now use the SupabaseManager class to:")
        print("   - Query tables: manager.query_table('loans')")
        print("   - Insert data: manager.insert_data('loans', {...})")
        print("   - Update data: manager.update_data('loans', {...}, {...})")
        print("   - Delete data: manager.delete_data('loans', {...})")
        print("   - Export tables: manager.export_table_to_json('loans')")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

