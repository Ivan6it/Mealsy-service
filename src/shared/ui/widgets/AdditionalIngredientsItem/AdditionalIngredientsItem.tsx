import styles from './AdditionalIngredientsItem.module.css';

type AdditionalIngredientsItemProps = {
  text: string;
  onClick(): void;
  className?: string;
};

export function AdditionalIngredientsItem({
  text,
  onClick,
  className,
}: AdditionalIngredientsItemProps) {
  return (
    <button onClick={onClick} className={`${styles.additionalIngredientsItem} ${className}`}>
      {text}
    </button>
  );
}
