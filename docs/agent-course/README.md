# Agent / Harness Academy

基于 [game-daily/agent-learning](../../agent-learning/Agent-Learning-Index.md) 的自助交互课程。**不依赖任何 JavaScript 框架、无后端、无第三方追踪脚本**，课程随站点静态发布。

## 在线地址

https://suesam.github.io/game-daily/agent-course/

## 学习内容

- Day 00（选修）到 Day 10：33 个知识单元、44 道单选题（附解析）、每阶段一个实践目标与 3 个边界测试。
- Day 01 内置可交互 Grid World；其余阶段有故障情境演示、代码骨架和实验要求。**这些演示不等于真实代码测试**。
- 阅读进度、历次测验、实验自查、自由笔记、仍困惑问题和自评信心均写入浏览器 localStorage。
- 本站不会发送学习记录到任何服务器。学习后点“导出 JSON”并把文件上传到 ChatGPT，即可进行个性化知识缺口分析。也可以导入同一版本的记录继续学习。
- 不建议在笔记里放任何 Token、密码或工作区私密内容。

## 运行

直接打开 docs/agent-course/index.html 即可。文件引用为相对路径，不需要 npm install 或 Python 服务。部署由 game-daily 的 GitHub Pages workflow 在课程文件修改时自动触发。

## 数据与隐私

localStorage 键为 agent-harness-academy-progress-v1，仅在当前浏览器和当前站点来源下保存；清理浏览器存储、使用无痕或换设备都可能丢失记录，请定期导出 JSON。记录导入会覆盖当前本机记录，需先确认。

## 判分与教学声明

测验由网页依据课程答案表即时判分，成绩和错题可复盘；代码实践的勾选仅代表学习者本人确认，网页没有真实编译/执行 Python 项目或自动验证 GitHub commit。

## 自动测试

修改课程站点会触发 GitHub Pages 构建并执行 `node docs/agent-course/site-smoke.cjs`，检查课程数量、33 节、44 题、章节跳转、测验判分、复盘笔记保存与刷新恢复。

## 2026-11-16 深度课程增补 v1.1

原始版本知识单元只包含简短概念和例子，无法独立学习。现将 33 个单元扩展为完整阅读章节：每节包含 4 段深入原理、4–5 步真实系统执行过程、带类型声明的代码示例、典型错误、主动思考题与折叠参考解析。以 `chapters-0-3.js`、`chapters-4-7.js`、`chapters-8-10.js` 维护分阶段内容，网页仍保持原测验/进度 Schema，旧浏览器记录可直接延续。

这些内容为原创的教学重组，包含简化的模拟代码与架构伪代码，**不是全部可直接运行的生产实现**；课程外部参考链接在每个 Day 下方。
