// @ts-nocheck
/**
 * Remove block quotes from string
 * @param {string} str 
 * @returns {string}
 * 
 * The function checks for single or double quotes character 
 * at the beginnig and end of a given string 
 * and replace the character with an empty string
 * 
 * The function uses Javascript string `replaceAll` method with 
 * a regular expression literal as it 1st argument and 
 * a replacer string (empty string) as 2nd argument
 * 
 * ----
 * 
 * Regular expression literal consist of a pattern enclosed between slashes,
 * * `/` Open. Indecates the start of a regular expression,
 * * `^` matches the beginning of the string
 * * `$` matches the end of the string
 * * `[]` matches any character in the set
 * * `|` is the "or" conditional flag
 * * `()` groups multiple tokens together.
 * * `+` match 1 or more of the preceding token.
 * * `/` Close. Indecates the end of a regular expression and the start of expression flags
 * * `g` is the global search flag.
 * 
 * Implementation:
 * ---------------
 * Replace all single/double quote occurrence with an empty string, 
 * where `^['|"]` i.e "string begins with single quote or double quote"
 * or where `(['|"]$)` i.e "string ends with single quote or double quote"
 */

const removeBlockQuoteChar = (str = "") => str.replaceAll(/^['|"]|(['|"]$)+/g, '');

