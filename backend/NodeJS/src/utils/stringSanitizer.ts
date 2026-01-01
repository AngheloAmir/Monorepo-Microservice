// Type definitions for string-sanitizer linked to the require
const sanitizer = require("string-sanitizer") as StringSanitizer;

interface SanitizeFunction {
    /**
     * Sanitizes a string by removing special characters.
     * @example
     * string.sanitize("a.bc@d efg#h"); // "abcdefgh"
     */
    (str: string): string;

    /**
     * Sanitizes string but keeps spaces.
     * @example
     * string.sanitize.keepSpace("a.bc@d efg#h"); // "abcd efgh"
     */
    keepSpace(str: string): string;

    /**
     * Sanitizes string but keeps unicode characters.
     * @example
     * string.sanitize.keepUnicode("a.bc@d efg#hক"); // "abcd efghক"
     */
    keepUnicode(str: string): string;

    /**
     * Sanitizes string and adds a fullstop.
     * @example
     * string.sanitize.addFullstop("a.bc@d efg#h"); // "abcd.efgh"
     */
    addFullstop(str: string): string;

    /**
     * Sanitizes string and adds an underscore.
     * @example
     * string.sanitize.addUnderscore("a.bc@d efg#h"); // "abcd_efgh"
     */
    addUnderscore(str: string): string;

    /**
     * Sanitizes string and adds a dash.
     * @example
     * string.sanitize.addDash("a.bc@d efg#h"); // "abcd-efgh"
     */
    addDash(str: string): string;

    /**
     * Removes numbers from the string.
     * @example
     * string.sanitize.removeNumber("@abcd efgh123"); // "abcdefgh"
     */
    removeNumber(str: string): string;

    /**
     * Keeps numbers in the string.
     * @example
     * string.sanitize.keepNumber("@abcd efgh123"); // "abcdefgh123"
     */
    keepNumber(str: string): string;
}

interface ValidateNamespace {
    /**
     * Validates if the string is a valid email.
     * @example
     * string.validate.isEmail("jhon@gmail.com") // "jhon@gmail.com"
     * string.validate.isEmail("jhongmail.com") // false
     * string.validate.isEmail("jhon@gmailcom") // false
     * string.validate.isEmail("jhon@@gmail.com") // false
     */
    isEmail(str: string): string | false;

    /**
     * Username Validation ✅
     * Username must be free from any special characters. There will be no space and must be at least 2 characters long.
     * Combination of numbers and letters is acceptable. Only numbers (i.e 123) are not acceptable. But only letters (i.e ea) will be acceptable.
     * 
     * Why minimum 2 letters not 3 letters? Because some of the username like (@ea) is still most popular.
     * Why automatically lowerstring applied? Because, most of the end user still don't understand the meaning of username. 
     * Sometimes they use upper letter. We just sanitized it. Nothing more.
     * 
     * @example
     * string.validate.isUsername("fazlulka") // "fazlulka"
     * string.validate.isUsername("Fazlulka") // "fazlulka" (Automatically lowerstring method applied.)
     * string.validate.isUsername("f") // false (Minimum 2 letters)
     * string.validate.isUsername("123") // false (Only number is not acceptable)
     * string.validate.isUsername("fazlulka@") // false (Special Character not accepted)
     * string.validate.isUsername("fazlulka_") // false (Special Character not accepted)
     */
    isUsername(str: string): string | false;

    /**
     * Password Validation ✅
     * 1. Most popular: To check a password between 6 to 15 characters which contain at least one numeric digit and a special character
     * @example
     * string.validate.isPassword6to15("password1@") // "password1@"
     * string.validate.isPassword6to15("password1") // false
     */
    isPassword6to15(str: string): string | false;

    /**
     * Password Validation ✅
     * 2. Most Secure: To check a password between 8 to 15 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character
     * @example
     * string.validate.isPassword8to15("password1Aa_"); // "password1Aa_"
     * string.validate.isPassword8to15("password1") // false
     */
    isPassword8to15(str: string): string | false;

    /**
     * Password Validation ✅
     * 3. Simpler Password: To check a password between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
     * @example
     * string.validate.isPassword6to20("password1Aa"); // "password1Aa"
     * string.validate.isPassword6to20("password1") // false
     */
    isPassword6to20(str: string): string | false;

    /**
     * Password Validation ✅
     * 4. Easy Password: To check a password between 7 to 20 characters which contain only characters, numeric digits, underscore and first character must be a letter. No special character accepted here.
     * @example
     * string.validate.isPassword7to20("password1") // "password1"
     * string.validate.isPassword7to20("password1@_") // false (No special characters)
     */
    isPassword7to20(str: string): string | false;
}

interface StringSanitizer {
    sanitize: SanitizeFunction;
    validate: ValidateNamespace;

    /**
     * Adds a fullstop between words.
     * @example
     * string.addFullstop("abcd efgh"); // "abcd.efgh"
     */
    addFullstop(str: string): string;

    /**
     * Adds an underscore between words.
     * @example
     * string.addUnderscore("@abcd efgh"); // "@abcd_efgh"
     */
    addUnderscore(str: string): string;

    /**
     * Adds a dash between words.
     * @example
     * string.addDash("@abcd efgh"); // "@abcd-efgh"
     */
    addDash(str: string): string;

    /**
     * Removes spaces from the string.
     * @example
     * string.removeSpace("@abcd efgh"); // "@abcdefgh"
     */
    removeSpace(str: string): string;

    /**
     * Removes underscores from the string.
     * @example
     * string.removeUnderscore("@ab__cd ef_gh_"); // "@abcd efgh"
     */
    removeUnderscore(str: string): string;
}

export default sanitizer;