#!/usr/bin/env sage
p = MixedIntegerLinearProgram(maximization=True, solver = "GLPK")
x = p.new_variable(integer=True, nonnegative=True, name="x")
y = p.new_variable(integer=True, nonnegative=True, name="y")
p.set_max(x,2)
p.set_max(y,2)
p.add_constraint(x[0]+x[2]+x[6] - y[0] == 0, name="CA_balance", )
p.add_constraint(x[0]+x[1]+x[7] - y[1] == 0, name="C2_balance",)
p.add_constraint(x[1]+x[2]+x[8] - y[2] == 0, name="C3_balance", )
p.add_constraint(x[3]+x[5]+x[6] - y[3] == 0, name="DA_balance", )
p.add_constraint(x[3]+x[4]+x[7] - y[4] == 0, name="D2_balance", )
p.add_constraint(x[4]+x[5]+x[8] - y[5] == 0, name="D3_balance", )

p.add_constraint(y[0] <= 0)
p.add_constraint(y[1] <= 0)
p.add_constraint(y[2] <= 1)
p.add_constraint(y[3] <= 0)
p.add_constraint(y[4] <= 0)
p.add_constraint(y[5] <= 1)
p.set_objective(y[0]* 10 + y[1]* 2 + y[2]* 3 + y[3]* 10 + y[4]* 2 + y[5]* 3)
p.show()

print('Objective Value: {}'.format(p.solve()))
for i, v in sorted(p.get_values(x, convert=ZZ, tolerance=1e-3).items()):
    if v != 0:
        print(f'x[{i}] = {v}')

for i, v in sorted(p.get_values(y, convert=ZZ, tolerance=1e-3).items()):
    if v != 0:
        print(f'y[{i}] = {v}')
