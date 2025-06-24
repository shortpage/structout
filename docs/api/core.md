React TSX example
=================

Need a quick demo component? Copy-paste the snippet below.

```tsx
import React from 'react';

type GreetingProps = {
  name: string;
};


export default function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}
```
