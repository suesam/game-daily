# Day 00｜模型基础与 Harness 约束（选修）

> 新增预备课程，不改变原计划十个阶段。

## 学习目标

1. Tokenizer / BPE：理解 Token 与字符、工具 Schema 成本。
2. Transformer / Self-Attention：理解上下文长度与计算成本的关系。
3. KV/Prefix Cache：理解可复用前缀与长期记忆不是一回事。
4. Context Window 与 Compaction：理解模型输入约束。
5. Structured Output / Tool Calling：理解模型适配器的差异。

## 资料

- [Karpathy Neural Networks: Zero to Hero](https://github.com/karpathy/nn-zero-to-hero) — 重点 Lecture 7（GPT from scratch）与 Lecture 8（Tokenizer），有视频和代码。
- [Hugging Face Agents Unit 1](https://huggingface.co/learn/agents-course/en/unit1/introduction) — LLM、消息格式与工具基础。
- [DSH Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) — 用真实 Harness 的 Prompt/Adapter 对照理论。

## 实验与 Done

- [ ] 比较普通短消息与长 Tool Schema 的 Token 量。
- [ ] 解释 KV Cache 与 Memory Store 的区别。
- [ ] 说明两个不同模型在工具协议/结构化输出上的适配差异。
- [ ] 记录真实/Mock 的观测条件，不编造缓存命中率。

状态：未开始。
