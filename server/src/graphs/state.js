// server/src/graphs/state.js
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,

  userInput: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),

  // order | knowledge | general
  intent: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),

  orderResult: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),

  ragResult: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),

  finalAnswer: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),
});
