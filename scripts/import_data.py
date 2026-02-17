"""
Script para importar dados da planilha Relatorio patrimonial.xls
para a tabela patrimonio_suap no Supabase via REST API.
"""
import xlrd
import json
import urllib.request
import sys

SUPABASE_URL = 'https://cemjvvppfxiaqycyflbk.supabase.co'
SUPABASE_KEY = 'sb_publishable_v3cjTDnk_mWOI2dW7nchMQ_n9SDMG27'
XLS_PATH = r'c:\Users\eftom\Documents\App IFCE\Relatorio patrimonial.xls'

def login():
    """Login and get access token"""
    data = json.dumps({'email': 'francisco.tomaz@ifce.edu.br', 'password': '2231581'}).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/auth/v1/token?grant_type=password',
        data=data,
        headers={'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}
    )
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp['access_token']

def read_xls():
    """Read XLS and return list of dicts"""
    wb = xlrd.open_workbook(XLS_PATH)
    sheet = wb.sheet_by_index(0)
    records = []
    for r in range(1, sheet.nrows):  # Skip header
        numero = str(sheet.cell_value(r, 1)).strip()
        if not numero or numero == '0' or numero == '0.0':
            continue
        # Convert float numbers to int strings (e.g. 608958.0 -> "608958")
        try:
            numero = str(int(float(numero)))
        except (ValueError, OverflowError):
            pass
        records.append({
            'numero': numero,
            'descricao': str(sheet.cell_value(r, 2)).strip() or None,
            'responsavel': str(sheet.cell_value(r, 3)).strip() or None,
            'campus': str(sheet.cell_value(r, 4)).strip() or None,
            'numero_serie': str(sheet.cell_value(r, 5)).strip() or None,
            'sala': str(sheet.cell_value(r, 6)).strip() or None,
            'estado_conservacao': str(sheet.cell_value(r, 7)).strip() or None,
        })
    return records

def upload_batch(token, records):
    """Upload a batch of records via Supabase REST API"""
    data = json.dumps(records).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/patrimonio_suap',
        data=data,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates'
        },
        method='POST'
    )
    try:
        resp = urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError as e:
        print(f'  Error: {e.code} - {e.read().decode()[:200]}')
        return False

def main():
    print('1. Reading XLS file...')
    records = read_xls()
    print(f'   Found {len(records)} records')
    
    print('2. Logging in...')
    token = login()
    print('   Login OK')
    
    print('3. Uploading data in batches of 500...')
    batch_size = 500
    success = 0
    failed = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(records) + batch_size - 1) // batch_size
        print(f'   Batch {batch_num}/{total_batches} ({len(batch)} records)...')
        if upload_batch(token, batch):
            success += len(batch)
        else:
            failed += len(batch)
    
    print(f'\nDone! Uploaded: {success}, Failed: {failed}')

if __name__ == '__main__':
    main()
