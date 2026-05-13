md_path = r'C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\archive\中级\PE基础.md'

with open(md_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Define code block regions: (start_line_1based, end_line_1based)
code_regions = [
    (98, 98),        # 1. #define IMAGE_NUMBEROF_DIRECTORY_ENTRIES
    (196, 204),      # 2. IMAGE_NT_HEADERS
    (212, 228),      # 3. IMAGE_FILE_HEADER
    (248, 312),      # 4. IMAGE_OPTIONAL_HEADER32
    (340, 370),      # 5. IMAGE_SECTION_HEADER (1st)
    (382, 480),      # 6. Characteristics #defines
    (486, 498),      # 7. Code example int a = 0x12345678
    (588, 618),      # 8. IMAGE_SECTION_HEADER (2nd)
    (824, 848),      # 9. IMAGE_EXPORT_DIRECTORY
    (949, 955),      # 10. GetProcAddress
    (986, 1004),     # 11. IMAGE_IMPORT_DESCRIPTOR
    (1054, 1068),    # 12. IMAGE_THUNK_DATA32
    (1084, 1090),    # 13. IMAGE_IMPORT_BY_NAME
    (1125, 1133),    # 14. IMAGE_BASE_RELOCATION
]

def clean_code(s):
    s = s.replace('`', '')
    # Fix spacing around //
    s = s.replace('  //', ' //')
    s = s.replace('\t//', ' //')
    # Replace full-width comma with half-width
    s = s.replace('，', ',')
    # Fix **return** etc. (bold markers inside code)
    s = s.replace('**', '')
    return s.rstrip()

def dedup_empty_lines(lines):
    """Remove consecutive empty lines, keeping at most one."""
    result = []
    prev_empty = False
    for l in lines:
        is_empty = (l.strip() == '')
        if is_empty and prev_empty:
            continue
        result.append(l)
        prev_empty = is_empty
    return result

# Build new content
new_lines = []
i = 0
while i < len(lines):
    line_no = i + 1
    region = None
    for start, end in code_regions:
        if line_no == start:
            region = (start, end)
            break

    if region:
        start, end = region
        code_lines = []
        for j in range(start - 1, min(end, len(lines))):
            cleaned = clean_code(lines[j])
            code_lines.append(cleaned)

        new_lines.append('```c\n')
        code_lines = dedup_empty_lines(code_lines)
        for cl in code_lines:
            new_lines.append(cl + '\n')
        new_lines.append('```\n')
        i = end
    else:
        new_lines.append(lines[i])
        i += 1

with open(md_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Fixed {len(code_regions)} code blocks')
