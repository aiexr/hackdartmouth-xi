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
  bestTimeToBuyAndSellStock: {
    source: "LeetCode",
    sourceId: "121",
    sourceTitle: "Best Time to Buy and Sell Stock",
    sourceSlug: "best-time-to-buy-and-sell-stock",
    sourceDifficulty: "Easy",
    sourceUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    topicTags: ["Array", "Dynamic Programming"],
    sourceHints: [
      "Track the minimum price seen so far as you scan left to right.",
      "At each index, compute profit as current price minus the running minimum.",
      "The answer is the maximum profit seen — no separate second pass needed.",
    ],
    description:
      "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day. You want to maximize your profit by choosing a single day to buy and choosing a different day in the future to sell. Return the maximum profit you can achieve. If you cannot achieve any profit, return `0`.",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price 1) and sell on day 5 (price 6), profit = 6 - 1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "No transaction achieves a profit, so return 0.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
  },
  maximumSubarray: {
    source: "LeetCode",
    sourceId: "53",
    sourceTitle: "Maximum Subarray",
    sourceSlug: "maximum-subarray",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/maximum-subarray/",
    topicTags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    sourceHints: [
      "If the running sum ever goes negative, it only hurts future subarrays — reset it to 0.",
      "Track both the running sum and a global maximum separately.",
      "This is Kadane's algorithm: one pass, two variables.",
    ],
    description:
      "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "nums = [1]",
        output: "1",
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
  },
  productOfArrayExceptSelf: {
    source: "LeetCode",
    sourceId: "238",
    sourceTitle: "Product of Array Except Self",
    sourceSlug: "product-of-array-except-self",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/product-of-array-except-self/",
    topicTags: ["Array", "Prefix Sum"],
    sourceHints: [
      "For each index you need the product of everything to the left and everything to the right.",
      "One left-to-right pass builds prefix products into the output array.",
      "A second right-to-left pass multiplies in the suffix product on the fly — no division needed.",
    ],
    description:
      "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`. You must write an algorithm that runs in O(n) time without using the division operation.",
    examples: [
      {
        input: "nums = [1,2,3,4]",
        output: "[24,12,8,6]",
      },
      {
        input: "nums = [-1,1,0,-3,3]",
        output: "[0,0,9,0,0]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.",
    ],
  },
  numberOfIslands: {
    source: "LeetCode",
    sourceId: "200",
    sourceTitle: "Number of Islands",
    sourceSlug: "number-of-islands",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/number-of-islands/",
    topicTags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find"],
    sourceHints: [
      "Each time you find an unvisited '1', you have found a new island — increment the counter.",
      "Flood-fill from that cell (DFS or BFS) to mark all connected land as visited.",
      "Marking visited land cells as '0' in place avoids needing a separate visited set.",
    ],
    description:
      "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: "1",
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'",
    ],
  },
  coinChange: {
    source: "LeetCode",
    sourceId: "322",
    sourceTitle: "Coin Change",
    sourceSlug: "coin-change",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/coin-change/",
    topicTags: ["Array", "Dynamic Programming", "Breadth-First Search"],
    sourceHints: [
      "Build a table dp[0..amount] where dp[i] = minimum coins to reach amount i.",
      "Initialize dp[0] = 0 and every other entry to Infinity.",
      "For each amount i, try every coin: dp[i] = min(dp[i], dp[i - coin] + 1) when i >= coin.",
    ],
    description:
      "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins needed to make up that amount. If that amount cannot be made up by any combination of the coins, return `-1`. You may assume you have an infinite number of each coin denomination.",
    examples: [
      {
        input: "coins = [1,2,5], amount = 11",
        output: "3",
        explanation: "11 = 5 + 5 + 1",
      },
      {
        input: "coins = [2], amount = 3",
        output: "-1",
      },
      {
        input: "coins = [1], amount = 0",
        output: "0",
      },
    ],
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
  },
  findMinimumInRotatedSortedArray: {
    source: "LeetCode",
    sourceId: "153",
    sourceTitle: "Find Minimum in Rotated Sorted Array",
    sourceSlug: "find-minimum-in-rotated-sorted-array",
    sourceDifficulty: "Medium",
    sourceUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    topicTags: ["Array", "Binary Search"],
    sourceHints: [
      "The minimum is always in the unsorted half of the array.",
      "If nums[mid] > nums[right], the pivot is in the right half — move left pointer to mid + 1.",
      "Otherwise the minimum is in the left half including mid — move right pointer to mid.",
    ],
    description:
      "Suppose an array of length `n` sorted in ascending order is rotated between 1 and `n` times. Given the sorted rotated array `nums` of unique elements, return the minimum element. You must write an algorithm that runs in O(log n) time.",
    examples: [
      {
        input: "nums = [3,4,5,1,2]",
        output: "1",
        explanation: "The original array was [1,2,3,4,5] rotated 3 times.",
      },
      {
        input: "nums = [4,5,6,7,0,1,2]",
        output: "0",
        explanation: "The original array was [0,1,2,4,5,6,7] rotated 4 times.",
      },
      {
        input: "nums = [11,13,15,17]",
        output: "11",
        explanation: "The original array was [11,13,15,17] rotated 4 times.",
      },
    ],
    constraints: [
      "n == nums.length",
      "1 <= n <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All the integers of nums are unique.",
      "nums is sorted and rotated between 1 and n times.",
    ],
  },
  trappingRainWater: {
    source: "LeetCode",
    sourceId: "42",
    sourceTitle: "Trapping Rain Water",
    sourceSlug: "trapping-rain-water",
    sourceDifficulty: "Hard",
    sourceUrl: "https://leetcode.com/problems/trapping-rain-water/",
    topicTags: ["Array", "Two Pointers", "Stack", "Dynamic Programming"],
    sourceHints: [
      "Water at each cell equals min(max height to the left, max height to the right) minus the cell's own height.",
      "Two pointers: maintain leftMax and rightMax. Advance whichever pointer has the smaller max.",
      "The side with the smaller max is the bottleneck — it can compute its water contribution without needing the other side.",
    ],
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map traps 6 units of rain water.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
      },
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
  },
} satisfies Record<string, LeetCodeCodingProblem>;
