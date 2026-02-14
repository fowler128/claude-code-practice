"""
Unit tests for the calculator functions in example.py
Run with: pytest test_example.py
"""
import pytest
from example import add, subtract, multiply, divide


class TestAdd:
    """Tests for the add function"""

    def test_add_positive_numbers(self):
        assert add(5, 3) == 8

    def test_add_negative_numbers(self):
        assert add(-5, -3) == -8

    def test_add_mixed_signs(self):
        assert add(-5, 3) == -2
        assert add(5, -3) == 2

    def test_add_zero(self):
        assert add(5, 0) == 5
        assert add(0, 5) == 5
        assert add(0, 0) == 0

    def test_add_floats(self):
        assert add(5.5, 3.2) == pytest.approx(8.7)


class TestSubtract:
    """Tests for the subtract function"""

    def test_subtract_positive_numbers(self):
        assert subtract(10, 4) == 6

    def test_subtract_negative_numbers(self):
        assert subtract(-10, -4) == -6

    def test_subtract_mixed_signs(self):
        assert subtract(-10, 4) == -14
        assert subtract(10, -4) == 14

    def test_subtract_zero(self):
        assert subtract(10, 0) == 10
        assert subtract(0, 10) == -10
        assert subtract(0, 0) == 0

    def test_subtract_floats(self):
        assert subtract(10.5, 4.2) == pytest.approx(6.3)


class TestMultiply:
    """Tests for the multiply function"""

    def test_multiply_positive_numbers(self):
        assert multiply(6, 7) == 42

    def test_multiply_negative_numbers(self):
        assert multiply(-6, -7) == 42

    def test_multiply_mixed_signs(self):
        assert multiply(-6, 7) == -42
        assert multiply(6, -7) == -42

    def test_multiply_by_zero(self):
        assert multiply(6, 0) == 0
        assert multiply(0, 7) == 0
        assert multiply(0, 0) == 0

    def test_multiply_by_one(self):
        assert multiply(6, 1) == 6
        assert multiply(1, 7) == 7

    def test_multiply_floats(self):
        assert multiply(2.5, 4) == 10.0


class TestDivide:
    """Tests for the divide function"""

    def test_divide_positive_numbers(self):
        assert divide(20, 4) == 5.0

    def test_divide_negative_numbers(self):
        assert divide(-20, -4) == 5.0

    def test_divide_mixed_signs(self):
        assert divide(-20, 4) == -5.0
        assert divide(20, -4) == -5.0

    def test_divide_by_zero(self):
        """Test that division by zero returns error message"""
        assert divide(10, 0) == "Cannot divide by zero"
        assert divide(0, 0) == "Cannot divide by zero"

    def test_divide_zero_by_number(self):
        assert divide(0, 5) == 0.0

    def test_divide_floats(self):
        assert divide(10.0, 4.0) == 2.5
        assert divide(7, 2) == 3.5

    def test_divide_returns_float(self):
        """Ensure division always returns float for valid operations"""
        result = divide(10, 5)
        assert result == 2.0
        assert isinstance(result, (int, float))


class TestEdgeCases:
    """Tests for edge cases and special values"""

    def test_very_large_numbers(self):
        large_num = 10**100
        assert add(large_num, large_num) == 2 * large_num
        assert subtract(large_num, 1) == large_num - 1

    def test_very_small_numbers(self):
        small_num = 0.0000001
        assert add(small_num, small_num) == pytest.approx(0.0000002)

    def test_precision_floats(self):
        # Test floating point precision issues
        result = add(0.1, 0.2)
        assert result == pytest.approx(0.3)


# Run tests with verbose output if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
