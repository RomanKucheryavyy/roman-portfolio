/**
 * A line of words parted by the page's one divider, the gold interpunct
 * (Act I's tags, a product's stack): each word led by a point in a 24px
 * slot of its own (drawn, with empty alternative text, so a screen reader
 * reads the words alone), the list pulled 24px left and clipped there, so
 * the point that would lead each line is out of sight and none ever
 * dangles at a line's end. INTERPUNCT_LIST on the list (with its own
 * type), INTERPUNCT on each item.
 */
export const INTERPUNCT_LIST = '-ml-6 flex flex-wrap items-center gap-y-1 [clip-path:inset(-0.5rem_-0.5rem_-0.5rem_1.5rem)]'
export const INTERPUNCT = "before:inline-block before:w-6 before:text-center before:text-gold before:content-['·'_/_'']"
