import styles from './tagInTheRecipe.module.css';

type TagInTheRecipeProps = {
  text: string;
  className?: string;
};

export function TagInTheRecipe({ text, className }: TagInTheRecipeProps) {
  return <div className={`${styles.tagInTheRecipe} ${className}`}>{text}</div>;
}
