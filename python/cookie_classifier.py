# cookie_classifier.py
import sys

def classify_cookie(name):
    essential = ['session_id', 'csrf_token']
    analytics = ['_ga', '_utm']
    marketing = ['ad_id', 'fb_pixel']
    if name in essential:
        return 'essential'
    elif name in analytics:
        return 'analytics'
    elif name in marketing:
        return 'marketing'
    else:
        return 'unknown'

if __name__ == "__main__":
    cookie_name = sys.argv[1]
    print(classify_cookie(cookie_name))