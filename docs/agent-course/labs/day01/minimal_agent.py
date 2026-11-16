"""Day 01 minimal Agent: no LLM or external dependencies."""
from dataclasses import dataclass

DIRECTIONS={"up":(0,-1),"down":(0,1),"left":(-1,0),"right":(1,0)}

@dataclass(frozen=True)
class Result:
    status: str
    pos: tuple
    steps: int = 0
    reason: str = ""

class GridWorld:
    def __init__(self,start=(0,0),goal=(2,0),walls={(1,1)}):
        self.position=start
        self.goal=goal
        self.walls=set(walls)
        self.observation_available=True
        self.trace=[]
    def observe(self):
        if not self.observation_available:
            return None
        return {"position":self.position,"goal":self.goal}
    def execute(self,action):
        if action not in DIRECTIONS:
            result=Result("rejected",self.position,reason="unknown_action")
        else:
            dx,dy=DIRECTIONS[action]
            x,y=self.position
            target=(x+dx,y+dy)
            if not (0<=target[0]<3 and 0<=target[1]<3):
                result=Result("rejected",self.position,reason="out_of_bounds")
            elif target in self.walls:
                result=Result("rejected",self.position,reason="obstacle")
            else:
                self.position=target
                result=Result("committed",self.position)
        self.trace.append((action,result))
        return result

class RightFirstPolicy:
    def decide(self,observation):
        x,y=observation["position"]
        gx,gy=observation["goal"]
        if x<gx: return "right"
        if x>gx: return "left"
        if y<gy: return "down"
        return "up"

def run_agent(env,policy,max_steps=10):
    if max_steps<0: raise ValueError("max_steps")
    for idx in range(max_steps+1):
        obs=env.observe()
        if obs is None:
            return Result("failed",env.position,idx,"observation_unavailable")
        if env.position==env.goal:
            return Result("success",env.position,idx)
        if idx==max_steps:
            return Result("failed",env.position,idx,"step_budget_exceeded")
        action=policy.decide(obs)
        env.execute(action)
    raise AssertionError("unreachable")

if __name__=="__main__":
    world=GridWorld()
    outcome=run_agent(world,RightFirstPolicy())
    print(outcome)
    for action,result in world.trace:
        print(action,"=>",result.status,result.pos,result.reason)
