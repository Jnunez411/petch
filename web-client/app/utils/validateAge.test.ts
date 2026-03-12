// Simple test for pet age validation
// Luis Carrillo 

import { describe, it, expect } from 'vitest';

const validateAge = (age: number): string | null => {
  if (age < 0) return "Age can't be negative";
  if (age > 30) return "That seems like an unusually high age. Please double-check.";
  return null;
};

describe('validateAge', () => {
  
  it('rejects negative age', () => {
    const result = validateAge(-1);
    expect(result).toBe("Age can't be negative");
  });

  it('warns when age exceeds 30', () => {
    const result = validateAge(31);
    expect(result).toBe("That seems like an unusually high age. Please double-check.");
  });

  it('accepts valid age of 5', () => {
    const result = validateAge(5);
    expect(result).toBeNull();
  });

});
