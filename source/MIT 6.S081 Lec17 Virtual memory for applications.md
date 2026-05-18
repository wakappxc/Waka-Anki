# 1

Q: Lec17 论文的核心观点是什么？

A: 用户应用程序也应该像内核一样从灵活的虚拟内存中获益，即应用程序也能使用虚拟内存机制（Page Fault、修改 PTE 权限等）。

GROUP: MIT 6.S081 Lec17

# 2

Q: 论文列举了哪些依赖虚拟内存特性的应用程序？

A: 1. Garbage Collector（垃圾回收器）
2. Data Compression（数据压缩）
3. Shared Virtual Memory（共享虚拟内存）

GROUP: MIT 6.S081 Lec17

# 3

Q: 应用程序使用虚拟内存需要哪些特性？（列举全部 6 个）

A: 1. **Trap**：Page Fault 能传播到用户空间，由用户态 handler 处理后再恢复执行
2. **Prot1**：降低单个 Page 的访问权限（如 RW → R 或 R → 无权限）
3. **ProtN**：批量降低 N 个 Page 的访问权限，分摊 TLB 刷新开销
4. **Unprot**：提升 Page 的访问权限（如 R → RW）
5. **Dirty**：查看 Page 是否为 Dirty
6. **map2**：将同一物理内存映射为两份虚拟内存，且拥有不同的访问权限

GROUP: MIT 6.S081 Lec17

# 4

Q: 为什么需要 ProtN？ProtN 和调用 N 次 Prot1 有什么区别？

A: 单次 ProtN 的损耗比 Prot1 大不了多少，但能分摊 TLB 刷新成本。

- ProtN：N 次修改 PTE + **1 次** TLB 刷新
- N 次 Prot1：N 次修改 PTE + **N 次** TLB 刷新

清除 TLB 比较费时，ProtN 将所有修改集中后只刷新一次 TLB，提升性能。

GROUP: MIT 6.S081 Lec17

# 5

Q: XV6 用户程序支持论文提出的虚拟内存特性吗？

A: 除 trap 相关的 alarm handler 外，XV6 不支持任何一个特性。XV6 内核有完整的虚拟内存机制，但没有以系统调用的形式暴露给用户空间。论文认为好的操作系统应该以系统调用形式提供这些特性。

GROUP: MIT 6.S081 Lec17

# 6

Q: mmap 系统调用的作用是什么？

A: 将某个对象（如文件、匿名内存）映射到调用者的虚拟地址空间中。

![mmap](C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\workspace\MIT 6.S081\附件\Pasted image 20260517112721.png)

GROUP: MIT 6.S081 Lec17

# 7

Q: mmap 的 6 个参数分别是什么？

A: 1. **addr**：期望映射的目标地址，传 null 由内核自动选择
2. **len**：映射的地址段长度
3. **prot**：Protection bit，如 R|W（读写）
4. **flags**：如 MAP_PRIVATE（更新文件时只修改内存拷贝，不写回磁盘）
5. **fd**：文件描述符（映射文件时使用）
6. **offset**：从文件的哪个偏移位置开始映射

GROUP: MIT 6.S081 Lec17

# 8

Q: 什么是 Memory Mapped File？有什么好处？

A: 通过 mmap 将文件内容映射到内存地址空间后，可以直接用指针操作读写文件，无需调用 read/write 系统调用。这是一个方便的接口，适合操作存储在文件中的数据结构。

GROUP: MIT 6.S081 Lec17

# 9

Q: mmap 除了映射文件还有什么用途？

A: 映射匿名内存（Anonymous Memory）。作为 sbrk 的替代方案，向内核申请物理内存并映射到虚拟地址空间。

GROUP: MIT 6.S081 Lec17

# 10

Q: MAP_PRIVATE 标志在 mmap 中的作用是什么？

A: 在 mmap 文件场景下，MAP_PRIVATE 表明对映射内容的更新不会写入磁盘，只会更新内存中的拷贝（Copy-on-Write 语义）。

GROUP: MIT 6.S081 Lec17

# 11

Q: mprotect 系统调用的作用是什么？

A: 修改已映射虚拟内存区域的访问权限，可以保护对象的一部分或整个对象。

![mprotect](C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\workspace\MIT 6.S081\附件\Pasted image 20260517112733.png)

GROUP: MIT 6.S081 Lec17

# 12

Q: 通过 mprotect 将一段内存设为只读（R）或完全不可访问（None），分别会发生什么？

A: - 设为**只读（R）**：load 指令正常，store 指令触发 Page Fault
- 设为**None**：任何访问（load 或 store）都触发 Page Fault

GROUP: MIT 6.S081 Lec17

# 13

Q: munmap 系统调用的作用是什么？

A: 移除一个地址或一段内存地址的映射关系。

![munmap](C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\workspace\MIT 6.S081\附件\Pasted image 20260517112737.png)

GROUP: MIT 6.S081 Lec17

# 14

Q: sigaction 系统调用的作用是什么？

A: 为特定 signal 设置 handler 函数。当 signal 发生时，内核会调用用户设置的 handler，而不是让程序 crash。

对于 Page Fault，产生的 signal 是 segfault；如果设置了 handler，程序不会 crash，handler 中可以调用 mprotect 修改内存权限来恢复执行。

![sigaction](C:\Users\YiyuYang\Desktop\Waka.KnowledgeBase\workspace\MIT 6.S081\附件\Pasted image 20260517112744.png)

GROUP: MIT 6.S081 Lec17

# 15

Q: sigaction 和 XV6 的 sigalarm 有什么区别？

A: sigaction 更通用，它可以响应任意类型的 signal（如 segfault），而 sigalarm 只能定时触发。sigalarm 不是标准 Unix 接口（是 XV6 lab 实现的）。

GROUP: MIT 6.S081 Lec17

# 16

Q: 论文提出的虚拟内存特性在 Unix 中如何对应？

A: | 论文特性 | Unix 接口 |
|---------|----------|
| trap | sigaction |
| Prot1 / ProtN / Unprot | mprotect |
| Dirty | 无直接系统调用，需要技巧实现 |
| map2 | 多次调用 mmap |

GROUP: MIT 6.S081 Lec17

# 17

Q: 为什么 mprotect 可以高效实现 ProtN？

A: mprotect 足够灵活，可以一次修改多个 Page 的权限，从而只需要清除一次 TLB，获得分摊 TLB 刷新成本的好处。

GROUP: MIT 6.S081 Lec17

# 18

Q: mprotect 和 XV6 的权限控制粒度有区别吗？

A: 没有区别，它们都在 Page 粒度工作（都是以整个 Page 为单位设置权限）。

GROUP: MIT 6.S081 Lec17

# 19

Q: 应用程序如何处理 segfault 而不 crash？

A: 1. 通过 sigaction 为 segfault signal 注册 handler
2. 当 Page Fault 发生时，内核产生 segfault signal
3. 内核调用用户注册的 handler（而不是终止程序）
4. handler 中可以调用 mprotect 修改内存权限来修复问题
5. 处理完成后返回，原指令恢复执行

GROUP: MIT 6.S081 Lec17