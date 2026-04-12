export type LeetCodeCodingProblem = {
  source: "LeetCode";
  sourceId: string;
  sourceTitle: string;
  sourceSlug: string;
  sourceDifficulty: "Easy" | "Medium" | "Hard";
  sourceUrl: string;
  topicTags: string[];
  sourceHints: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
};

// Curated from the local `leetcode_questions.json` dataset shared for this repo.
export const leetCodeCodingProblems = {
  twoSum: {
    source: "LeetCode",
    sourceId: "1",
    sourceTitle: "Two Sum",
    sourceSlug: "two-sum",
    sourceDifficulty: "Easy",
    sourceUrl: "https://leetcode.com/problems/two-sum/",
    topicTags: ["Array", "Hash Table"],
    sourceHints: [
      "Start from the brute-force pair scan so you can justify why it is too slow.",
      "Ask how to find the complement of the current value faster than another full scan.",
      "Use extra space when it buys constant-time lookup for previously seen values.",
    ],
    description:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, the answer is [0,1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
  },
  validParentheses: {
    source: "LeetCode",
    sourceId: "20",
    sourceTitle: "Valid Parentheses",
    sourceSlug: "valid-parentheses",
    sourceDifficulty: "Easy",
    sourceUrl: "https://leetcode.com/problems/valid-parentheses/",
    topicTags: ["String", "Stack"],
    sourceHints: [
      "Use a stack of opening brackets.",
      "On each closing bracket, verify it matches the top of the stack before popping.",
      "Any mismatch or leftover opening bracket means the string is invalid.",
    ],
    description:
      "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. A string is valid if open brackets are closed by the same type, in the correct order, and every closing bracket has a matching opening bracket.",
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
      {
        input: 's = "([])"',
        output: "true",
      },
      {
        input: 's = "([)]"',
        output: "false",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists only of the characters ()[]{}.",
    ],
  },
  mergeIntervals: {
    source: "LeetCode",
    sourceId: "56",
    sourceTitle: "Merge Intervals",
    sourceSlug: "merge-intervals",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/merge-intervals/",
    topicTags: ["Array", "Sorting"],
    sourceHints: [],
    description:
      "Given an array of intervals where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Intervals [1,3] and [2,6] overlap, so they merge into [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Intervals that touch at the boundary are considered overlapping.",
      },
      {
        input: "intervals = [[4,7],[1,4]]",
        output: "[[1,7]]",
        explanation: "Sorting first exposes the boundary overlap and lets you merge to [1,7].",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4",
    ],
  },
  topKFrequentElements: {
    source: "LeetCode",
    sourceId: "347",
    sourceTitle: "Top K Frequent Elements",
    sourceSlug: "top-k-frequent-elements",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/top-k-frequent-elements/",
    topicTags: [
      "Array",
      "Hash Table",
      "Divide and Conquer",
      "Sorting",
      "Heap (Priority Queue)",
      "Bucket Sort",
      "Counting",
      "Quickselect",
    ],
    sourceHints: [],
    description:
      "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.",
    examples: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        output: "[1,2]",
      },
      {
        input: "nums = [1], k = 1",
        output: "[1]",
      },
      {
        input: "nums = [1,2,1,2,1,2,3,1,3,2], k = 2",
        output: "[1,2]",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "k is in the range [1, number of unique elements in the array].",
      "The answer is guaranteed to be unique.",
    ],
  },
  lruCache: {
    source: "LeetCode",
    sourceId: "146",
    sourceTitle: "LRU Cache",
    sourceSlug: "lru-cache",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/lru-cache/",
    topicTags: ["Hash Table", "Linked List", "Design", "Doubly-Linked List"],
    sourceHints: [],
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the `LRUCache` class with `get(key)` and `put(key, value)` operations. Both functions must run in O(1) average time.",
    examples: [
      {
        input:
          '["LRUCache","put","put","get","put","get","put","get","get","get"] with [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: "[null,null,null,1,null,-1,null,-1,3,4]",
        explanation:
          "With capacity 2, inserting keys 3 and 4 evicts the least recently used keys 2 and then 1.",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put.",
    ],
  },
  wordLadder: {
    source: "LeetCode",
    sourceId: "127",
    sourceTitle: "Word Ladder",
    sourceSlug: "word-ladder",
    sourceDifficulty: "Hard",
    sourceUrl: "https://leetcode.com/problems/word-ladder/",
    topicTags: ["Hash Table", "String", "Breadth-First Search"],
    sourceHints: [],
    description:
      "A transformation sequence from `beginWord` to `endWord` using a dictionary `wordList` changes one letter at a time, every intermediate word must be in `wordList`, and the final word must equal `endWord`. Return the number of words in the shortest transformation sequence, or `0` if no such sequence exists.",
    examples: [
      {
        input:
          'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
        output: "5",
        explanation:
          'One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog".',
      },
      {
        input:
          'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]',
        output: "0",
        explanation:
          'Because "cog" is not in wordList, no valid transformation sequence exists.',
      },
    ],
    constraints: [
      "1 <= beginWord.length <= 10",
      "endWord.length == beginWord.length",
      "1 <= wordList.length <= 5000",
      "wordList[i].length == beginWord.length",
      "beginWord, endWord, and wordList[i] consist of lowercase English letters.",
      "beginWord != endWord",
      "All words in wordList are unique.",
    ],
  },
} satisfies Record<string, LeetCodeCodingProblem>;
