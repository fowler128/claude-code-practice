# Simple calculator program

def add(a, b):
      """Add two numbers together"""
      return a + b

def subtract(a, b):
      """Subtract b from a"""
      return a - b

def multiply(a, b):
      """Multiply two numbers"""
      return a * b

def divide(a, b):
      """Divide a by b"""
      if b == 0:
                return "Cannot divide by zero"
      return a / b

# Demo usage (only runs when script is executed directly)
if __name__ == "__main__":
    print("Calculator Demo")
    print("=" * 40)
    print("5 + 3 =", add(5, 3))
    print("10 - 4 =", subtract(10, 4))
    print("6 * 7 =", multiply(6, 7))
    print("20 / 4 =", divide(20, 4))
    print("10 / 0 =", divide(10, 0))
    print()
    print("Run 'pytest test_example.py' for full test suite")
