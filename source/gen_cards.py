import base64, os

img_dir = r'C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\archive\中级\附件'

cards_data = [
    ('1771717719684-9f11e0bb-495f-4c06-bb30-0d327019b14d.png',
     'PE文件指纹识别：如何识别一个文件是PE文件？',
     '① 文件开头有0x5A4D(MZ)<br>② 0x003C位置的值指向PE头偏移<br>③ 该偏移处有0x4550(PE标识)<br><br>不能只看后缀名，.sys/.dll也可能是PE文件'),

    ('1771717712399-3f733712-71c4-425d-a5c5-5f4d640b8a33.png',
     'PE文件整体结构由哪些部分组成？',
     'DOS MZ头(64B) → DOS块 → PE标识(4B) → 标准PE头(20B) → 扩展PE头(32位224B/64位240B) → 节表(N x 40B) → 节数据'),

    ('1771717713523-9e906cdd-87e7-4809-a673-1db3036960c5.png',
     'PE主要结构体及其宽度（字节）',
     'IMAGE_DOS_HEADER = 64B<br>IMAGE_FILE_HEADER = 20B<br>IMAGE_OPTIONAL_HEADER32 = 224B<br>IMAGE_SECTION_HEADER = 40B'),

    ('1771717713207-96f13e44-734b-4055-ad36-a34159e079b5.png',
     'DOS MZ文件头(IMAGE_DOS_HEADER)占多少字节？关键成员？',
     '占64字节。关键成员：<br>① e_magic(2B) - MZ标识 0x5A4D<br>② e_lfanew(4B) - 指向PE文件头的偏移<br>其他成员可全部置0不影响运行'),

    ('1771717722807-07c630f2-e5a6-41dc-b887-4579de85da52.png',
     'e_lfanew成员的作用是什么？',
     'IMAGE_DOS_HEADER的e_lfanew成员存储了PE文件头的偏移地址。<br>操作系统通过此成员从DOS头跳转到PE头，是PE指纹的关键一步。'),

    ('1771717716947-fa48d9c6-6b75-41ef-bed2-991a6b8ccb50.png',
     'PE文件头(IMAGE_NT_HEADERS)由哪三部分组成？',
     '① Signature(4B) - PE标识 0x4550(不可修改)<br>② FileHeader(20B) - 标准PE头(IMAGE_FILE_HEADER)<br>③ OptionalHeader(32:224B / 64:240B) - 扩展PE头'),

    ('1771717726383-1b14044f-0e42-4572-93c3-dd6e1673d85d.png',
     '扩展PE头(IMAGE_OPTIONAL_HEADER)的关键成员有哪些？',
     '① Magic - 32位0x10B / 64位0x20B<br>② AddressOfEntryPoint - 程序入口RVA<br>③ ImageBase - 内存镜像基址<br>④ SectionAlignment - 内存对齐<br>⑤ FileAlignment - 文件对齐<br>⑥ SizeOfImage - 内存映射大小<br>⑦ SizeOfHeaders - 所有头对齐后大小'),

    ('1771717728357-6b52ed58-0fa5-48d2-b478-c4b0bf1b8e88.png',
     '节表(IMAGE_SECTION_HEADER)的关键成员有哪些？',
     '① Name(8B) - 节名(可自定义)<br>② Misc.VirtualSize - 节未对齐真实尺寸<br>③ VirtualAddress - 内存中偏移(RVA)<br>④ SizeOfRawData - 文件中对齐后尺寸<br>⑤ PointerToRawData - 节在文件中的偏移<br>⑥ Characteristics - 节的属性'),

    ('1771717754674-eb7c9e9b-d81c-49c9-9599-ce2fa2044f34.png',
     'IMAGE_FILE_HEADER的Characteristics各数据位表示什么？',
     '16位属性：<br>BIT 0 - 仅用于16位<br>BIT 1 - 可重定位<br>BIT 2 - 可执行<br>BIT 3 - 行号<br>BIT 4 - 本地符号<br>BIT 5 - 小端模式<br>BIT 13 - DLL文件<br>BIT 14 - 仅用于32位<br>BIT 15 - 有调试信息'),

    ('1771717755556-c889bfb5-de96-4592-84f7-84229b6a1a0c.png',
     'DllCharacteristics成员各数据位表示什么？',
     '16位特性：<br>BIT 2 - 动态基址(DYNAMIC_BASE)<br>BIT 4 - NX兼容(NX_COMPAT)<br>BIT 6 - 不隔离(NO_ISOLATION)<br>BIT 7 - 结构化异常处理(SEH)<br>BIT 8 - WDM驱动<br>BIT 11 - 终端服务器感知<br>注意：不只是针对DLL文件'),

    ('1771717757767-b80dab08-3821-49cc-ba42-63b2c267909c.png',
     '节(IMAGE_SECTION_HEADER)的Characteristics属性位图',
     '关键位：<br>0x00000020 - 包含代码(CNT_CODE)<br>0x00000040 - 包含初始化数据<br>0x00000080 - 包含未初始化数据<br>0x20000000 - 可执行(MEM_EXECUTE)<br>0x40000000 - 可读(MEM_READ)<br>0x80000000 - 可写(MEM_WRITE)'),

    ('1771717761870-5c782861-f49d-4828-bbee-6cd39492eb43.png',
     '什么是RVA和FOA？如何将RVA转换为FOA？',
     'RVA = 相对虚拟地址(运行时)，FOA = 文件偏移地址(磁盘上)<br><br>转换步骤：<br>① RVA = 内存地址 - ImageBase<br>② 若RVA在PE头中 -> RVA = FOA<br>③ 若在节中：差值 = RVA - 节.VirtualAddress<br>   FOA = 节.PointerToRawData + 差值<br><br>当文件对齐=内存对齐时，RVA = FOA'),

    ('1771717790347-421985ca-367d-4de7-bd06-f931bd3ec534.png',
     '如何扩大最后一个节？(步骤)',
     '① 文件末尾插入所需空间(如0x1000)<br>② 修改最后一个节表的SizeOfRawData和VirtualSize(取最大值内存对齐后+插入大小)<br>③ 如需执行代码，修改节属性<br>④ 修改SizeOfImage(加插入大小)'),

    ('1771717819978-46c02bcd-01aa-421a-9c07-b5038ffa7b26.png',
     '导出表(IMAGE_EXPORT_DIRECTORY)的结构和定位？',
     '定位：扩展PE头数据目录第1个结构体 -> VirtualAddress(导出表RVA) + Size<br><br>关键成员：<br>① Name - DLL名字符串地址<br>② Base - 导出函数起始序号<br>③ NumberOfFunctions - 所有函数个数<br>④ NumberOfNames - 名字导出函数个数<br>⑤ AddressOfFunctions - 函数地址表RVA<br>⑥ AddressOfNames - 函数名称表RVA<br>⑦ AddressOfNameOrdinals - 函数序号表RVA'),

    ('1771717825136-56b6bc8b-fb74-4fd2-b373-39eed3a97885.png',
     '导出表：通过函数名"Mul"查找地址的步骤',
     '① AddressOfNames查索引(按A-Z排序)<br>② 对应索引查AddressOfNameOrdinals拿序号<br>③ 对应序号查AddressOfFunctions拿地址'),

    ('1771717825312-3fc34d3e-0dde-4dba-bc9d-13327ae7642f.png',
     '导出表：通过序号(13)查找地址的步骤',
     '① 序号 - Base(起始序号) = 索引值<br>② 该索引值代入AddressOfFunctions直接获得函数地址'),

    ('1771717848999-3940d939-7a3e-4d76-9537-16f19d98f17c.png',
     '导入表INT和IAT：加载前两者的关系？',
     '加载前：INT(OriginalFirstThunk)和IAT(FirstThunk)指向不同的表，但内容完全一致。<br>都指向IMAGE_THUNK_DATA32结构数组，每个结构要么是序号(最高位为1)，要么是指向IMAGE_IMPORT_BY_NAME的RVA'),

    ('1771717850686-41dc84a0-441c-4a6f-9b6d-d15754747b21.png',
     '导入表INT和IAT：加载后两者的区别？',
     '加载后：<br>INT保持不变(作为参照)<br>IAT被系统修改，直接存储函数的真实内存地址<br><br>调用时通过IAT间接call -> 从IAT中取出地址再call'),

    ('1771717858109-546eed0c-0a1b-4bc5-848b-027383f5a4b3.png',
     '重定位表的作用是什么？如何定位？',
     '作用：当DLL/PE加载地址与ImageBase冲突时，记录需要修正的硬编码位置。<br><br>定位：扩展PE头数据目录第6个结构体<br><br>结构：IMAGE_BASE_RELOCATION(8B)后跟N个2字节重定位项<br>高4位=3时，低12位为偏移量，地址=VirtualAddress+低12位<br>按物理页(4KB)组织'),

    ('1771717750133-039a523f-dac7-45c4-bcea-f279f0a3cca0.png',
     '程序入口地址如何计算？AddressOfEntryPoint和ImageBase的关系？',
     '程序入口地址 = ImageBase + AddressOfEntryPoint<br><br>例如：AddressOfEntryPoint=0x739D, ImageBase=0x1000000<br>-> 入口地址 = 0x100739D'),
]

# Generate TSV
lines = ['#separator:tab', '#html:true']
for filename, front_q, back_a in cards_data:
    img_path = os.path.join(img_dir, filename)
    if not os.path.exists(img_path):
        print(f'WARNING: {img_path} not found')
        continue

    with open(img_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')

    front_html = front_q
    back_html = '{}<br><br><img src="data:image/png;base64,{}">'.format(back_a, b64)

    def escape_tsv(val):
        if '\t' in val or '\n' in val or val.startswith('"'):
            val = val.replace('"', '""')
            val = '"' + val + '"'
        return val

    front_esc = escape_tsv(front_html)
    back_esc = escape_tsv(back_html)
    lines.append('{}\t{}\tPE\tPE'.format(front_esc, back_esc))

output = r'C:\Users\YiyuYang\Desktop\Waka-Anki\source\PE基础.txt'
with open(output, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Generated {} cards'.format(len(lines) - 2))
print('Output: {}'.format(output))
