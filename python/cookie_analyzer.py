# cookie_analyzer.py
import sys
import json
import pandas as pd
import numpy as np

cookie_list = json.loads(sys.argv[1])
df = pd.DataFrame(cookie_list, columns=['name'])
df['type'] = df['name'].apply(lambda x: 'essential' if x in ['session_id', 'csrf_token'] else 'analytics' if x in ['_ga', '_utm'] else 'marketing' if x in ['ad_id', 'fb_pixel'] else 'unknown')
type_counts = df['type'].value_counts().to_dict()
print(json.dumps(type_counts))