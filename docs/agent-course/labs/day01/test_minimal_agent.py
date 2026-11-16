import unittest
from minimal_agent import GridWorld, RightFirstPolicy, run_agent

class AgentTests(unittest.TestCase):
    def test_goal_in_two_steps(self):
        w=GridWorld()
        outcome=run_agent(w,RightFirstPolicy(),max_steps=2)
        self.assertEqual((outcome.status,outcome.pos,outcome.steps),
                         ("success",(2,0),2))
        self.assertEqual(len(w.trace),2)

    def test_wall_rejected_state_unchanged(self):
        w=GridWorld(start=(0,1))
        result=w.execute("right")
        self.assertEqual(result.reason,"obstacle")
        self.assertEqual(w.position,(0,1))

    def test_invalid_action(self):
        w=GridWorld()
        self.assertEqual(w.execute("teleport").reason,"unknown_action")
        self.assertEqual(w.position,(0,0))

    def test_observation_failure(self):
        w=GridWorld()
        w.observation_available=False
        result=run_agent(w,RightFirstPolicy())
        self.assertEqual(result.reason,"observation_unavailable")
        self.assertFalse(w.trace)

    def test_budget_stops_loop(self):
        w=GridWorld()
        result=run_agent(w,RightFirstPolicy(),max_steps=1)
        self.assertEqual(result.reason,"step_budget_exceeded")
        self.assertEqual(len(w.trace),1)

    def test_already_at_goal_no_action(self):
        w=GridWorld(start=(2,0))
        result=run_agent(w,RightFirstPolicy())
        self.assertEqual((result.status,result.steps),("success",0))
        self.assertFalse(w.trace)

    def test_rejected_moves_never_count_as_success(self):
        w=GridWorld(start=(0,1))
        result=run_agent(w,RightFirstPolicy(),max_steps=3)
        self.assertEqual(result.status,"failed")
        self.assertEqual(w.position,(0,1))
        self.assertEqual(len(w.trace),3)

if __name__=="__main__":
    unittest.main()
