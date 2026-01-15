# Container-Based Extraction

Extract lists of structured items by defining a container pattern and nested field patterns.

## Overview

Container-based extraction allows you to scrape multiple items from a page (e.g., product listings, article feeds, search results). You define:

- A **container pattern** that identifies each item in the list
- **Field patterns** that extract data from within each container

## Basic Container Extraction

```typescript
interface Product {
  name: string;
  price: string;
  image: string;
}

const patterns: PatternField[] = [
  // Container pattern - defines the list items
  {
    key: 'container',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//div[@class="product-card"]'],
    meta: { isContainer: true },
  },
  // Field patterns - extracted from each container
  {
    key: 'name',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//h3[@class="product-name"]/text()'],
    pipes: { trim: true },
  },
  {
    key: 'price',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[@class="price"]/text()'],
    pipes: { trim: true },
  },
  {
    key: 'image',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//img/@src'],
  },
];

const result = await scraper.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns,
});

console.log(result.results);
// [
//   { name: "Product 1", price: "$19.99", image: "image1.jpg" },
//   { name: "Product 2", price: "$29.99", image: "image2.jpg" },
//   ...
// ]
```

## How It Works

1. **Container Selection**: The service finds all nodes matching the container pattern
2. **Context Extraction**: For each container, field patterns are evaluated within that container's context
3. **Result Assembly**: Extracted fields are combined into objects, one per container

## XPath Context in Containers

When using containers, field patterns use relative XPath (starting with `.`):

```typescript
{
  key: 'name',
  patterns: ['.//h3/text()'],  // .// means search within current container
}

// NOT:
{
  key: 'name',
  patterns: ['//h3/text()'],  // // searches entire document
}
```

## Advanced Container Patterns

### Alternative Container Patterns

Use `alterPattern` to handle different page layouts:

```typescript
{
  key: 'container',
  patterns: ['//div[@class="product-card"]'],
  meta: {
    isContainer: true,
    alterPattern: [
      '//li[@class="product"]',
      '//article[@class="product-item"]',
    ],
  },
}
```

### Nested Field Extraction

Extract complex nested data:

```typescript
interface Product {
  name: string;
  price: {
    current: string;
    original?: string;
  };
  reviews: {
    count: string;
    rating: string;
  };
}

const patterns: PatternField[] = [
  {
    key: 'container',
    patterns: ['//div[@class="product"]'],
    meta: { isContainer: true },
  },
  {
    key: 'name',
    patterns: ['.//h2/text()'],
    pipes: { trim: true },
  },
  {
    key: 'price',
    patterns: ['.//span[@class="current-price"]/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '[^0-9.]', to: '' }],
    },
  },
  {
    key: 'originalPrice',
    patterns: ['.//span[@class="original-price"]/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '[^0-9.]', to: '' }],
    },
  },
  {
    key: 'reviewCount',
    patterns: ['.//span[@class="review-count"]/text()'],
    pipes: { trim: true },
  },
  {
    key: 'rating',
    patterns: ['.//div[@class="rating"]/@data-score'],
  },
];
```

### Multiple Values per Container

Extract arrays from within each container:

```typescript
interface Product {
  name: string;
  features: string[];
  images: string[];
}

const patterns: PatternField[] = [
  {
    key: 'container',
    patterns: ['//div[@class="product"]'],
    meta: { isContainer: true },
  },
  {
    key: 'name',
    patterns: ['.//h2/text()'],
    pipes: { trim: true },
  },
  {
    key: 'features',
    patterns: ['.//ul[@class="features"]//li/text()'],
    meta: { multiple: true },
  },
  {
    key: 'images',
    patterns: ['.//div[@class="gallery"]//img/@src'],
    meta: { multiple: true },
  },
];
```

## Real-World E-commerce Example

```typescript
interface ProductListing {
  name: string;
  price: string;
  rating: string;
  reviewCount: string;
  image: string;
  availability: string;
}

const patterns: PatternField[] = [
  {
    key: 'container',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//li[contains(@class, "product")]'],
    meta: { isContainer: true },
  },
  {
    key: 'name',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//h2[contains(@class, "product-title")]/text()'],
    meta: {
      alterPattern: ['.//a[@class="product-link"]/@title'],
    },
    pipes: {
      trim: true,
      replace: [{ from: '\\s+', to: ' ' }],
    },
  },
  {
    key: 'price',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[@class="price"]//bdi/text()'],
    pipes: {
      trim: true,
      replace: [
        { from: '\\$', to: '' },
        { from: ',', to: '' },
      ],
    },
  },
  {
    key: 'rating',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//div[@class="star-rating"]/@style'],
  },
  {
    key: 'reviewCount',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[@class="review-count"]/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '[^0-9]', to: '' }],
    },
  },
  {
    key: 'image',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//img/@src'],
  },
  {
    key: 'availability',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[contains(@class, "stock")]/text()'],
    pipes: {
      trim: true,
      toLowerCase: true,
    },
  },
];

const result = await scraper.evaluateWebsite<ProductListing>({
  url: 'https://www.scrapingcourse.com/ecommerce/',
  patterns,
});

console.log(`Found ${result.results.length} products`);

// Filter in-stock products
const inStock = result.results.filter((p) => p.availability === 'in stock');
console.log(`In stock: ${inStock.length}`);
```

## Non-Container Extraction (Single Item)

If you don't need a container, you can extract a single object:

```typescript
interface PageData {
  title: string;
  description: string;
  links: string[];
}

const patterns: PatternField[] = [
  // No container pattern
  {
    key: 'title',
    patterns: ['//title/text()'],
    pipes: { trim: true },
  },
  {
    key: 'description',
    patterns: ['//meta[@name="description"]/@content'],
    pipes: { trim: true },
  },
  {
    key: 'links',
    patterns: ['//a/@href'],
    meta: { multiple: true },
  },
];

const result = await scraper.evaluateWebsite<PageData>({
  url: 'https://example.com',
  patterns,
});

console.log(result.results);
// [
//   {
//     title: "Example Page",
//     description: "An example page",
//     links: ["/link1", "/link2", ...]
//   }
// ]
```

## Best Practices

1. **Use specific container selectors**: Target specific classes or IDs
2. **Keep patterns relative**: Use `.//` for field patterns within containers
3. **Provide fallback containers**: Use `alterPattern` for robustness
4. **Handle missing fields**: Some containers may not have all fields
5. **Validate structure**: Use `validateXpath()` to test patterns

## Common Patterns

### Product Listings

```typescript
patterns: ['//div[@class="product"]', '//li[contains(@class, "item")]'];
```

### Article Feeds

```typescript
patterns: ['//article', '//div[@class="post"]'];
```

### Search Results

```typescript
patterns: ['//div[@class="search-result"]', '//li[@class="result"]'];
```

### Table Rows

```typescript
patterns: ['//table[@class="data"]//tr'];
```

## Related Features

- [Pattern-Based Extraction](./pattern-based-extraction.md) - Basic pattern concepts
- [Data Cleaning Pipes](./data-cleaning-pipes.md) - Transform extracted data
- [XPath Validation](./xpath-validation.md) - Test your patterns
