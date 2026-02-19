
export interface Testimonial {
  name: string;
  age: number;
  text: string;
  rating: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface StackItem {
  title: string;
  value: number;
  image: string;
  isBonus?: boolean;
}
