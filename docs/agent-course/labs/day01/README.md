# Day 01 · 可运行的最小 Agent

课程网页给出原理；这里提供完整 Python 文件和 7 个自动测试。Python 3.10+，无需模型 API 与第三方依赖。

从仓库根目录运行：

    python docs/agent-course/labs/day01/minimal_agent.py
    python -m unittest discover -s docs/agent-course/labs/day01 -p 'test_*.py' -v

阅读顺序：

1. GridWorld 保存真实 Environment State，并通过 observe 提供可见投影。
2. RightFirstPolicy 负责选择 Action，但不能直接改变坐标。
3. execute 检查墙壁与边界；拒绝时真实位置不变。
4. run_agent 实现 observe → decide → execute，并检查目标、观测失败和步数预算。
5. Tests 验证正常完成、障碍拒绝、非法动作、感知失败、预算退出和禁止越过障碍。

独立练习：把 RightFirstPolicy 改成能够绕开中央墙的 Policy，新增两个单元测试。然后注入一个 observe 失败场景，确保不会误报成功。

实际测试通过后保存输出或 commit，再在网页中勾选对应实践结果。