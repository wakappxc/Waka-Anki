# 1

Q: 什么是虚拟机（Virtual Machine）？什么是 VMM？

A: 虚拟机是对计算机的一种模拟，足够运行一个操作系统。VMM（Virtual Machine Monitor / Hypervisor）位于硬件之上，取代标准操作系统内核，模拟多台计算机来运行 Guest 操作系统。

GROUP: MIT 6.S081 Lec19

# 2

Q: VMM 架构中 Host 空间和 Guest 空间分别运行什么？

A: Host 空间运行 VMM（Supervisor mode）。Guest 空间运行 Guest 操作系统内核（Guest Supervisor Mode）和 Guest 用户进程（Guest User Mode）。VMM 需要完全按照实际硬件行为来模拟这两种模式。

GROUP: MIT 6.S081 Lec19

# 3

Q: 使用虚拟机的主要原因有哪些？

A: 1. 在一台物理机上运行多个独立 OS，节省资源（如公司内 DNS、Firewall 等服务）
2. 云计算中提供灵活的资源分配和更高的硬件利用率
3. 方便内核开发与调试（如 QEMU 提供 gdb 访问）
4. 提供快照、迁移等额外功能

GROUP: MIT 6.S081 Lec19

# 4

Q: 为什么不能让 Guest kernel 直接运行在宿主机的 Supervisor mode？

A: 若 Guest kernel 运行在 Supervisor mode，它可以修改真实的 Page Table、控制 PTE 内容、读写任意内存，从而从虚拟机中逃逸，破坏隔离性。因此 Guest kernel 必须运行在 User mode。

GROUP: MIT 6.S081 Lec19

# 5

Q: 什么是 Trap-and-Emulate 虚拟化策略？

A: 将 Guest kernel 运行在宿主机的 User mode。普通指令直接在硬件上全速执行；当 Guest 执行 privileged 指令时触发 trap 进入 VMM，VMM 模拟该指令的行为后再返回 Guest。核心：Guest 以为自己执行了 privileged 指令，实际由 VMM 代劳。

GROUP: MIT 6.S081 Lec19

# 6

Q: 为什么 RISC-V 特别适合实现 Trap-and-Emulate 虚拟机？

A: RISC-V 设计时就考虑了虚拟化需求：每个在 Supervisor mode 才能执行的 privileged 指令（如读写 SCAUSE、STVEC 等），在 User mode 执行都会触发 trap，VMM 可以完整捕获所有 Guest 的 privileged 操作。

GROUP: MIT 6.S081 Lec19

# 7

Q: VMM 为每个 Guest 维护哪些虚拟状态信息？

A: 1. 所有虚拟 privileged 寄存器：STVEC、SEPC、SCAUSE 等
2. mode：Guest 当前处于 User mode 还是 Supervisor mode
3. hartid：当前模拟的 CPU 核编号
VMM 为每个 Guest 保存一份独立的虚拟状态，类似 XV6 为每个进程维护 proc 结构。

GROUP: MIT 6.S081 Lec19

# 8

Q: Guest 执行读取 privileged 寄存器（如 SEPC）时，VMM 如何模拟？

A: 1. 读取 SEPC 是 privileged 指令，触发 trap 进入 VMM
2. VMM 检查指令，发现是读 SEPC，将虚拟 SEPC 的值拷贝到 trapframe 中的用户寄存器
3. VMM 将 trapframe 拷贝回真实用户寄存器，sret 返回
4. Guest 读到了 VMM 替它保管的虚拟 SEPC 值

GROUP: MIT 6.S081 Lec19

# 9

Q: VMM 如何知道 Guest 当前处于 User mode 还是 Supervisor mode？

A: VMM 在虚拟状态信息中维护 mode 字段。当 Guest 执行 sret（Supervisor→User）时，sret 是 privileged 指令会触发 trap，VMM 据此将虚拟 mode 从 Supervisor 更新为 User。ECALL（User→Supervisor）同理。

GROUP: MIT 6.S081 Lec19

# 10

Q: 在 Trap-and-Emulate 中，Guest 用户进程执行系统调用（ECALL）时 VMM 如何处理？

A: 1. ECALL 触发 trap 进入 VMM
2. VMM 发现当前虚拟 mode=User，指令是 ECALL
3. 设置虚拟 SEPC=ECALL 地址，虚拟 mode=Supervisor，虚拟 SCAUSE=系统调用
4. 将真实 SEPC 设为虚拟 STVEC（Guest trap handler 地址）
5. sret 返回，Guest 进入自己的 trap handler
（Guest 以为自己 trap 到了 Guest kernel，实际经过 VMM 中转）

GROUP: MIT 6.S081 Lec19

# 11

Q: 什么是 Shadow Page Table？为什么要用它？

A: VMM 创建的合成 Page Table，将 gva（Guest 虚拟地址）直接映射到 hpa（主机物理地址）。因为 Guest Page Table 映射的是 gva→gpa（Guest 物理地址），但 gpa 不对应真实物理内存，需要 Shadow Page Table 完成真正的地址翻译，同时阻止 Guest 访问未分配给它的内存。

GROUP: MIT 6.S081 Lec19

# 12

Q: Shadow Page Table 如何构建？

A: 1. 从 Guest Page Table 取出每条记录，获得 gva→gpa 映射
2. 使用 VMM 维护的 gpa→hpa 映射，将 gpa 翻译成 hpa
3. 将 gva→hpa 存入 Shadow Page Table
4. 将 Shadow Page Table 地址写入真实 SATP 寄存器
（Guest 以为自己用的是正常 Page Table，实际硬件用的是 Shadow Page Table）

GROUP: MIT 6.S081 Lec19

# 13

Q: Guest 直接修改 PTE 时，VMM 如何同步 Shadow Page Table？

A: Guest 修改 PTE 后必须执行 sfence.vma 让硬件感知修改。sfence.vma 是 privileged 指令，触发 trap 进入 VMM。VMM 重新扫描 Guest Page Table，将合法修改更新到 Shadow Page Table，执行真实 sfence.vma，再返回 Guest。

GROUP: MIT 6.S081 Lec19

# 14

Q: 虚拟机外部设备的三种实现策略及特点？

A: 1. 模拟（Emulation）：完全模拟真实硬件，每次 I/O 触发 trap。兼容任意 OS 但低效
2. 虚拟设备（Virtual Device）：提供专用接口（如 virtio），通过内存命令队列交互，减少 trap。需 Guest 知道虚拟设备
3. 直通（Pass-through）：硬件直接分配子设备给 Guest（如 SR-IOV 网卡），性能最高

GROUP: MIT 6.S081 Lec19

# 15

Q: 为什么 Intel 要对虚拟机提供硬件支持（VT-x）？

A: 1. 虚拟机应用广泛，大量客户使用
2. Trap-and-Emulate 方案中大量 privileged 指令触发 trap，性能损耗大
3. x86 处理器的部分实现使得纯软件 Trap-and-Emulate 不够容易，需要硬件修复

GROUP: MIT 6.S081 Lec19

# 16

Q: VT-x 中 root mode 和 non-root mode 分别是什么？

A: root mode：VMM 运行模式，使用真实的控制寄存器
non-root mode：Guest 运行模式，硬件提供一套独立的虚拟控制寄存器拷贝。Guest 可直接执行 privileged 指令操作虚拟寄存器，无需 trap。目标：Guest 在不触发 trap 的前提下执行 privileged 指令。

GROUP: MIT 6.S081 Lec19

# 17

Q: VT-x 中的 VMCS 是什么？主要相关指令有哪些？

A: VMCS（Virtual Machine Control Structure）是 VMM 内存中配置虚拟机的结构体，包含配置信息和所有寄存器初始值。
指令：VMLAUNCH（创建并启动虚拟机）、VMRESUME（恢复 Guest 运行）、VMCALL（Guest 在 non-root mode 中主动退出到 VMM）。

GROUP: MIT 6.S081 Lec19

# 18

Q: 什么是 EPT（Extended Page Table）？与 Shadow Page Table 有何区别？

A: EPT 是 VT-x 提供的硬件二级地址翻译。MMU 自动完成 gva→gpa（Guest Page Table）→hpa（EPT）。由 VMM 配置，限制 Guest 只能访问分配的内存。
区别：Shadow Page Table 是软件方案，需 VMM 手动合成映射，Guest 修改 Page Table 需要 trap；EPT 是硬件自动完成，Guest 可直接修改自己的 Page Table 无需 trap，性能更好。

GROUP: MIT 6.S081 Lec19

# 19

Q: Trap-and-Emulate 中 Guest 仍需要 trap 到 VMM 的场景有哪些？

A: 即使有 VT-x 硬件支持，以下情况 Guest 仍需退出到 VMM：
1. VMCALL 指令（Guest 主动调用）
2. 设备中断（如定时器中断，实现多个 Guest 分时共享 CPU）
3. 部分 I/O 操作

GROUP: MIT 6.S081 Lec19

# 20

Q: Dune 论文的核心思想是什么？

A: 利用 VT-x 硬件（原本为虚拟机设计）来增强普通 Linux 进程。进程在 non-root Supervisor mode 下运行，拥有独立的虚拟 CR3 寄存器和 Page Table，同时受 EPT 限制无法访问其他进程或内核的内存。

GROUP: MIT 6.S081 Lec19

# 21

Q: Dune 提供的两个主要应用场景是什么？

A: 1. 安全隔离插件代码：进程在 Guest Supervisor mode 运行主程序（如浏览器），在 Guest User mode 运行不信任插件，通过不同 Page Table 限制插件只能访问指定内存。插件的系统调用 trap 到主程序而非内核
2. 加速 GC：进程通过 CR3 直接读取 PTE dirty 位，检测 GC 期间被修改的对象，比系统调用快得多

GROUP: MIT 6.S081 Lec19

# 22

Q: Dune 如何利用 PTE dirty 位加速垃圾回收（GC）？

A: GC 与程序并行运行时，程序可能修改已扫描对象。传统方式通过系统调用获取 dirty 位，又慢又困难。Dune 进程可直接通过 CR3 访问自己的 Page Table，用普通 load/store 读取 PTE dirty 位，快速定位被修改的内存 Page 并重新扫描。

GROUP: MIT 6.S081 Lec19

# 23

Q: Dune 管理的进程能否逃逸或危害真实操作系统？为什么？

A: 不能。虽然进程拥有 non-root Supervisor mode 和虚拟 CR3，但 EPT 由 VMM/Dune 配置，将进程的物理地址空间限制在分配给它的内存 Page 内。进程无法访问其他进程或内核内存，就像一个被限制的虚拟机。

GROUP: MIT 6.S081 Lec19
