# 1

Q: 1991年Appel-Li论文的核心观点是什么？

A: 用户应用程序也应该像内核一样灵活使用虚拟内存机制（Page Fault、PTE修改），从中获得收益，而非仅限于内核使用。

GROUP: MIT 6.S081 Lec17

# 2

Q: 用户应用程序使用虚拟内存需要哪6个特性？

A: TRAP、Prot1、ProtN、Unprot、Dirty、Map2

GROUP: MIT 6.S081 Lec17

# 3

Q: 什么是TRAP特性（用户态虚拟内存上下文）？

A: 使内核中的Page Fault能传播到用户空间，由用户态handler处理，处理完毕再返回内核恢复正常执行。是所有Page Fault机制的基础。

GROUP: MIT 6.S081 Lec17

# 4

Q: 什么是Prot1？

A: 降低单个内存Page的accessability（读写权限）。例如：将可读写Page变为只读，或将只读Page变为完全无权限。

GROUP: MIT 6.S081 Lec17

# 5

Q: 什么是ProtN？为什么需要ProtN而不是多次调用Prot1？

A: 批量降低N个Page的accessability。ProtN只需清除一次TLB，而N次Prot1需要清除N次TLB。清除TLB很费时，ProtN通过分摊这个开销提升性能。

GROUP: MIT 6.S081 Lec17

# 6

Q: 什么是Unprot？

A: 增加内存Page的accessability。例如：将只读Page变为可读可写。与Prot1/ProtN方向相反。

GROUP: MIT 6.S081 Lec17

# 7

Q: 什么是Dirty特性？

A: 能够查看一个内存Page是否被修改过（是否为Dirty），即检查Page的dirty bit状态。

GROUP: MIT 6.S081 Lec17

# 8

Q: 什么是Map2？

A: 将同一个物理内存地址空间映射两次，产生两份虚拟内存映射，且两份映射拥有不同的accessability（如一份可读可写、一份只读）。

GROUP: MIT 6.S081 Lec17

# 9

Q: 论文列举了哪些依赖用户态虚拟内存特性的应用程序？

A: Garbage Collector（垃圾回收器）、Data Compression Application（数据压缩应用）、Shared Virtual Memory（共享虚拟内存）

GROUP: MIT 6.S081 Lec17

# 10

Q: XV6在用户程序中支持上述6个虚拟内存特性吗？

A: 除了类似TRAP的alarm handler外，XV6不支持任何一个。XV6内核中有完整的虚拟内存机制，但没有以系统调用的形式暴露给用户空间。

GROUP: MIT 6.S081 Lec17

# 11

Q: 论文认为一个好的操作系统应该如何提供虚拟内存特性？

A: 应该以系统调用的形式将TRAP、Prot1、ProtN、Unprot、Dirty、Map2等特性暴露给用户空间，供应用程序使用。

GROUP: MIT 6.S081 Lec17

# 12

Q: 现代Unix系统（如Linux）支持这些虚拟内存特性吗？

A: 虽然具体实现形式可能与论文描述不完全一致，但这些特性如今已在现代Unix系统中广泛支持。

GROUP: MIT 6.S081 Lec17

# 13

Q: 修改PTE后为什么需要清除TLB？ProtN如何利用这一点优化性能？

A: TLB缓存了虚拟地址到物理地址的映射，PTE修改后缓存失效，必须清除TLB才能让新映射生效，但清除TLB很费时。ProtN将N次PTE修改合并为一次TLB清除，分摊了开销。

GROUP: MIT 6.S081 Lec17
