.. _ref-operators:

##################
Operator catalogue
##################

.. contents::
   :local:

The operators available in the condition builder of an ``If`` or ``Loop`` step.
For what operators *do*, see :doc:`../concepts/execution`; for how to add one,
:doc:`../guides/branch-and-loop`.

Conditions are stored as an expression and evaluated by the OCEL expression
processor. Saving an operator with no expression is refused with
``OPERATOR_EXPRESSION_IS_EMPTY``.

Loop operators
==============

A ``Loop`` operator exposes a **loop variable** (the iterator) that you reference
inside the loop to read the current item. The info panel beside the condition
documents the selected operator with its arguments and examples.

A ``Loop`` operator exposes a **loop variable** (the iterator). The info panel
next to the condition documents the selected operator with its description,
arguments and examples, and shows the iterator reference you use inside the
loop.

.. list-table::
   :header-rows: 1
   :widths: 15 30 55

   * - Operator
     - Description
     - Arguments
   * - ``For``
     - Iterates through an array.
     - ``o1`` – an array to iterate through.
   * - ``ForIn``
     - Iterates through the properties of an object.
     - ``o1`` – an object whose properties should be iterated.
   * - ``SplitString``
     - Splits a string using a delimiter and iterates through the resulting
       array.
     - ``o1`` – a string to split, ``o2`` – a delimiter string.

Examples:

* ``For`` with ``o1 = ["a", "b", "c"]`` iterates through ``"a"``, ``"b"``,
  ``"c"``; with ``o1 = []`` it performs no iterations.
* ``ForIn`` with ``o1 = {"name":"Hob","age":123}`` iterates through the
  properties ``"name"`` and ``"age"``.
* ``SplitString`` with ``o1 = "a,b,c"`` and ``o2 = ","`` iterates through
  ``"a"``, ``"b"``, ``"c"``.


IF operators
============

**1. Contains - “Contains”**

**Description:** Checks if a list contains a specific value.

**Arguments:**

- **`o1`**: A list of items to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A single value or a list where the first element is the value to search for, and the second element is the list.

**Examples:**

- `o1 = ["apple", "banana", "cherry"], o2 = "banana"` → Returns `true`
- `o1 = null, o2 = ["banana", ["apple", "banana", "cherry"]]` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "grape"` → Returns `false`

---

**2. ContainsSubStr - “ContainsSubStr”**

**Description:** Checks if any string in a list contains a specified substring.

**Arguments:**

- **`o1`**: A list of strings to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A substring to search for or a list where the first element is the substring and the second element is the list.

**Examples:**

- `o1 = ["hello", "world", "java"], o2 = "wor"` → Returns `true`
- `o1 = null, o2 = ["wor", ["hello", "world", "java"]]` → Returns `true`
- `o1 = null, o2 = "wor"` → Throws `RuntimeException` (invalid input)
- `o1 = ["apple", "banana"], o2 = "pine"` → Returns `false`

---

**3. DenyList - “DenyList”**

**Description:** Ensures a value is not in a restricted list.

**Arguments:**

- **`o1`**: A value to check.
- **`o2`**: A list or string of restricted values.

**Examples:**

- `o1 = "guest", o2 = "admin,user,manager"` → Returns `true`
- `o1 = "admin", o2 = "admin,user,manager"` → Returns `false`

---

**4. EqualTo - “=”**

**Description:** Compares two values for equality.

**Arguments:**

- **`o1`**: First value to compare.
- **`o2`**: Second value to compare.

**Examples:**

- `o1 = "test", o2 = "test"` → Returns `true`
- `o1 = "test1", o2 = "test2"` → Returns `false`

---

**5. GreaterThan - “>”**

**Description:** Checks if the first numeric value is greater than the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 3` → Returns `true`
- `o1 = 2, o2 = 5` → Returns `false`

---

**6. GreaterThanOrEqualTo - “>=”**

**Description:** Checks if the first numeric value is greater than or equal to the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 5` → Returns `true`
- `o1 = 3, o2 = 5` → Returns `false`

---

**7. IsEmpty - “IsEmpty”**

**Description:** Verifies if a list is empty.

**Arguments:**

- **`o1`**: A list to check (cannot be `null`).
- **`o2`**: Ignored.

**Examples:**

- `o1 = [], o2 = null` → Returns `true`
- `o1 = [1, 2], o2 = null` → Returns `false`
- `o1 = null, o2 = null` → Throws `RuntimeException`

---

**8. IsNotEmpty - “NotEmpty”**

**Description:** Verifies if a list is not empty.

**Arguments:**

- **`o1`**: A list to check (cannot be `null`).
- **`o2`**: Ignored.

**Examples:**

- `o1 = [1, 2], o2 = null` → Returns `true`
- `o1 = [], o2 = null` → Returns `false`
- `o1 = null, o2 = null` → Throws `RuntimeException`

---

**9. IsNotNull - “NotNull”**

**Description:** Validates that an object is not null.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: Ignored.

**Examples:**

- `o1 = "hello", o2 = null` → Returns `true`
- `o1 = null, o2 = null` → Returns `false`

---

**10. IsNull - “IsNull”**

**Description:** Validates that an object is null.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: Ignored.

**Examples:**

- `o1 = null, o2 = null` → Returns `true`
- `o1 = "value", o2 = null` → Returns `false`

---

**11. IsTypeOf - “IsTypeOf”**

**Description:** Checks if an object is of a specific type.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: A string representing the expected type.

**Examples:**

- `o1 = 123, o2 = "Integer"` → Returns `true`
- `o1 = "text", o2 = "Integer"` → Returns `false`

---

**12. LessThan - “<”**

**Description:** Checks if the first numeric value is less than the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 2, o2 = 5` → Returns `true`
- `o1 = 6, o2 = 5` → Returns `false`

---

**13. LessThanOrEqualTo - “<=”**

**Description:** Checks if the first numeric value is less than or equal to the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 5` → Returns `true`
- `o1 = 7, o2 = 5` → Returns `false`

---

**14. Like - “Like”**

**Description:** Performs SQL-style "LIKE" pattern matching.

**Arguments:**

- **`o1`**: String to evaluate.
- **`o2`**: Pattern string (`%` is a wildcard).

**Examples:**

- `o1 = "hello", o2 = "h%o"` → Returns `true`
- `o1 = "hello", o2 = "h%z"` → Returns `false`

---

**15. Matches - “Matches”**

**Description:** Matches a string against a regular expression.

**Arguments:**

- **`o1`**: String to match.
- **`o2`**: Regular expression.

**Examples:**

- `o1 = "abc123", o2 = "\\w+\\d+"` → Returns `true`
- `o1 = "abc", o2 = "\\d+"` → Returns `false`

---

**16. MatchesInList - “AllowList”**

**Description:** Checks if a string matches any patterns in a list.

**Arguments:**

- **`o1`**: String to match.
- **`o2`**: A list of patterns or a single comma-separated string of patterns.

**Examples:**

- `o1 = "test1", o2 = "test1,test2,test3"` → Returns `true`
- `o1 = "test4", o2 = "test1,test2,test3"` → Returns `false`

---

**17. NotContains - “NotContains”**

**Description:** Validates that a value is not in a list.

**Arguments:**

- **`o1`**: A list to search within.
- **`o2`**: A value to check for.

**Examples:**

- `o1 = ["apple", "banana"], o2 = "cherry"` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "apple"` → Returns `false`

---

**18. NotContainsSubStr - “NotContainsSubStr”**

**Description:** Validates that a substring is not found in any string in a list.

**Arguments:**

- **`o1`**: A list of strings to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A substring to search for.

**Examples:**

- `o1 = ["hello", "world"], o2 = "java"` → Returns `true`
- `o1 = ["hello", "java"], o2 = "java"` → Returns `false`
- `o1 = null, o2 = ["java", ["hello", "world"]]` → Returns `true`

---

**19. NotEqualTo - “!=”**

**Description:** Validates that two values are not equal.

**Arguments:**

- **`o1`**: First value to compare.
- **`o2`**: Second value to compare.

**Examples:**

- `o1 = "test1", o2 = "test2"` → Returns `true`
- `o1 = "test1", o2 = "test1"` → Returns `false`

---

**20. NotLike - “NotLike”**

**Description:** Validates that a string does not match a "LIKE" pattern.

**Arguments:**

- **`o1`**: String to evaluate.
- **`o2`**: Pattern string (`%` is a wildcard).

**Examples:**

- `o1 = "hello", o2 = "h%o"` → Returns `false`
- `o1 = "hello", o2 = "h%z"` → Returns `true`

---

**21. PropertyExists - “PropertyExists”**

**Description:** Checks if a property (key or value) exists in a collection.

**Arguments:**

- **`o1`**: A map, list, or set.
- **`o2`**: A key or value to check for.

**Examples:**

- `o1 = {"key1": "value1"}, o2 = "key1"` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "cherry"` → Returns `false`

---

**22. PropertyNotExists - “PropertyNotExists”**

**Description:** Validates that a property does not exist in a collection.

**Arguments:**

- **`o1`**: A map, list, or set.
- **`o2`**: A key or value to check for.

**Examples:**

- `o1 = {"key1": "value1"}, o2 = "key2"` → Returns `true`
- `o1 = {"key1": "value1"}, o2 = "key1"` → Returns `false`

---

**23. RegEx - “RegEx”**

**Description:** Matches a string against a regular expression.

**Arguments:**

- **`o1`**: Input string.
- **`o2`**: Regular expression.

**Examples:**

- `o1 = "123abc", o2 = "\\d+"` → Returns `true`
- `o1 = "abc", o2 = "\\d+"` → Returns `false`


.. _ref-pagination-examples:

Pagination
==========

Declared in the invoker, not in the workflow — see
:ref:`concept-pagination` for what the parameters mean.

Pagination parameters:
