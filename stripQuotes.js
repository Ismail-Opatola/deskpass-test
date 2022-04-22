// @ts-nocheck
/**
 * Remove block quotes from string
 * @param {string} str
 * @param {boolean} removeAll
 * @returns {string}
 *
 * `stripQuotes` accepts two arguments, first the string and second a boolean (option to remove all quotes).
 *
 * If `removeAll` is true, `stripQuotes` will strip all single or double quotes character in the entire string 
 * except for where there is an apostrophy followed by letter S i.e `'s`
 *
 * If `removeAll` is false, `stripQuotes` will strip only the boundary quotes.
 * It checks for single or double quotes character at the beginnig and end of a given string and replace the character with an empty string.
 *
 * Regular expression literal consist of a pattern enclosed between slashes,
 * * `/` Open. Indicates the start of a regular expression,
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
 * If `removeAll`, Replace all single/double quote occurrence with an empty string,
 * where ([",']+)([",'']+) i.e empty single or double qoutes exist in pears
 * or where [']+(?=[a-r|t-z]) i.e remove aposthrophy preceding any letter but the letter s
 * or where `^['|"]` i.e "string begins with single quote or double quote"
 * or where `(['|"]$)` i.e "string ends with single quote or double quote"
 * Else
 * Replace all single/double quote occurrence with an empty string,
 * where `^['|"]` i.e "string begins with single quote or double quote"
 * or where `(['|"]$)` i.e "string ends with single quote or double quote"
 * 
 * This approach helps solve an edge case where we intend to strip more than the boundary qoutes of a block quotes. We can easily specify to removeAll qoutes. 
 *
 * Note: For Node backward compatibility, avoid using `replaceAll` instead use `replace` with a global flag
 */

const stripQuotes = (str = "", removeAll = false) => {
  if (removeAll)
    // strip all single and double quotes except `'s` apostrophe-s
    return str.replace(
      /([",']+)([",'']+)|[']+(?=[a-r|t-z])|(^['|"])|(['|"]$)+/g,
      ""
    );

  // strip boundary quotes
  return str.replace(/^['|"]|(['|"]$)+/g, "");
};

console.log(stripQuotes("'This '' is somebody's timeline'"));
console.log(stripQuotes("'This '' is somebody's timeline'", true));
console.log(stripQuotes("''Your pasta's so 'tasty'''", true));
console.log(stripQuotes("''Your pasta's so ''tasty'''", true));
