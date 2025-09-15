#!/usr/bin/env python3
import os
import re
import glob

def fix_test_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern to match installHeadlessWallet before goto
    pattern = r'(await installHeadlessWallet\([^)]+\{[^}]+\}\);)\s*\n\s*(await page\.goto\([^)]+\);)'

    # Check if pattern exists
    if re.search(pattern, content):
        # Swap the order - goto first, then installHeadlessWallet
        fixed_content = re.sub(pattern, r'\2\n\n    \1', content)

        with open(filepath, 'w') as f:
            f.write(fixed_content)
        print(f"Fixed: {os.path.basename(filepath)}")
        return True
    return False

# Find all test files
test_files = glob.glob('/Users/chriskitch/Repos/arena/headless-wallet/test/*.spec.js')

fixed_count = 0
for test_file in test_files:
    if fix_test_file(test_file):
        fixed_count += 1

print(f"\nFixed {fixed_count} files")