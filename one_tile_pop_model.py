import math

def n():
	print "\n"

def getGrowthRate(growth):
	try:
		return input("What is the new growth rate?")
	except:
		return growth

def growthValidationAndCommentary(growth, population):
	n()

	# Validate growth rate
	if growth <= -100:
		growth = -100
		print "You Monster"
	elif growth > 50:
		growth = 50
		print "Too many babies! Growth rate is capped at 50%"

	return growth

def displayStats():
	print "Population: %s" % population
	print "Carrying Capacity: %s" % carryingCapacity
	n()

def adjustPopulation(population, growth, carryingCapacity):
	growth = getGrowthRate(growth)
	growth = growthValidationAndCommentary(growth, population)

	n()
	population = int(math.floor(population * (1 + (growth * .01))))

	if population > carryingCapacity + 1:
		starvation = int((population - carryingCapacity) / 2)
		print "You grew to", population, "but then", starvation, "people starved"
		population = population - starvation

	return [population, growth]

# If population is above carrying capacity, carrying capacity diminishes
# If population is below carrying capacity, carrying capacity increases to equilibrium
def adjustCarryingCapacity(carryingCapacity, population, carryingCapacityEquilibrium):
	# overconsumtion
	if carryingCapacity < population:
		deltaCC = carryingCapacity - population
	# undersonsumption
	else:
		surplus = carryingCapacity - population
		deltaCC = (1.2 * surplus) * (1 - (carryingCapacity / carryingCapacityEquilibrium))

	return carryingCapacity + deltaCC

def testEndConditions(carryingCapacity, population):
	if carryingCapacity <= 0:
		print "The land lies barren. Nothing but starvation awaits you and your people."
		print "Game Over"
		n()
		return 1

	if population <= 0:
		print "The last of your clan have died."
		print "Perhaps someday an archaeologist will discover your bones."
		n()
		return 1

	return 0

while True:
	n()	
	print "welcome to the one tile population simulator"
	print "each round represents a generation, you can control growth rate"
	print "if you exceed carrying capacity, it decreases future carrying capactiy"
	print "growth rate is measured in % increase so '20' is a 20% rate for 100 person population will yeild 120 people next generation"
	n()


	population = 40
	carryingCapacity = 100
	carryingCapacityEquilibrium = 100
	growth = 20

	while True:
		displayStats()
		population, growth = adjustPopulation(population, growth, carryingCapacity)
		carryingCapacity = adjustCarryingCapacity(carryingCapacity, population, carryingCapacityEquilibrium)

		
		end = testEndConditions(carryingCapacity, population)
		if end:
			break
		if growth == 123:
			break
	n()
	try:
		input("Again?")
	except:
		print ""