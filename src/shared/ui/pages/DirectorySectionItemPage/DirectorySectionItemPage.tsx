import styles from './DirectorySectionItemPage.module.css';
import { SectionCards } from '@/shared/ui/widgets/SectionCards';
import { getGenitive } from '@/shared/helpers/helpersFunction';
import { Comments } from '@/shared/ui/widgets/Comments';
import { Mailing } from '@/shared/ui/widgets/Mailing';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import type { FoodsState } from '@/store/foodsListSlice';
import { useState } from 'react';
import { updateDirectoryItemComments } from '@/store/directorySectionSlice';
import { NotFoundPage } from '../NotFoundPage';
import type { DirectoryComment, Answer } from '@/types/directorySection';

function getCurrentDate() {
  return Date.now();
}

export default function DirectorySectionItemPage() {
  const { sectionName, itemId } = useParams();
  const { foods }: FoodsState = useSelector<RootState, FoodsState>((state) => state.foodsList);
  const [comment, setComment] = useState('');
  const [answer, setAnswer] = useState({
    value: false,
    id: 0,
    name: '',
  });
  const recipesData = itemId ? foods.filter((item) => item.productTags.includes(itemId)) : [];

  const { directorySection, loading } = useSelector((state: RootState) => state.directorySection);
  const userState = useSelector((state: RootState) =>
    'id' in state.user.userData ? state.user.userData.id : undefined,
  );
  const dispatch = useDispatch<AppDispatch>();

  const hasData = !!userState;
  function answerSelectUser(value: boolean, id: number, name: string) {
    setAnswer({
      value,
      id,
      name,
    });
  }

  function setCommentText(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComment(e.target.value);
  }

  function sendComment() {
    if (comment.trim().length === 0 || userState === undefined) {
      return;
    }
    if (comment.trim().length !== 0) {
      if (answer.id !== 0 && !answer.value) {
        const date = getCurrentDate();
        const newComment = {
          date,
          user: {
            id: userState,
          },
          comment: comment,
          replyTo: answer.id,
        };

        const comments = currentSectionItem.comments?.map((i: DirectoryComment) => {
          if (i.date === answer.id) {
            return {
              ...i,
              answers: [...(i.answers ?? []), newComment],
            };
          }

          return i;
        });

        dispatch(
          updateDirectoryItemComments({
            id: currentSectionItem.id,
            comments: comments ?? [],
          }),
        );

        setComment('');
        setAnswer({
          value: false,
          id: 0,
          name: '',
        });
      } else if (answer.id !== 0 && answer.value) {
        const date = getCurrentDate();
        const newComment = {
          date,
          user: {
            id: userState,
          },
          comment: comment,
          replyTo: answer.id,
        };

        const comments = currentSectionItem.comments?.map((i: DirectoryComment) => {
          if (i.answers?.some((item: Answer) => item.date === answer.id)) {
            return {
              ...i,
              answers: [...(i.answers ?? []), newComment],
            };
          }

          return i;
        });

        dispatch(
          updateDirectoryItemComments({
            id: currentSectionItem.id,
            comments: comments ?? [],
          }),
        );

        setComment('');
        setAnswer({
          value: false,
          id: 0,
          name: '',
        });
      } else {
        const date = getCurrentDate();
        const newComment = {
          date,
          user: {
            id: userState,
          },
          comment: comment,
          answers: [],
        };

        dispatch(
          updateDirectoryItemComments({
            id: currentSectionItem.id,
            comments: [newComment, ...(currentSectionItem.comments ?? [])],
          }),
        );

        setComment('');
      }
    }
  }

  const currentSection = directorySection.filter((item) => item.id === sectionName)[0];
  const currentSectionItem = currentSection?.products?.filter((item) => item.id === itemId)[0];
  if (!currentSectionItem && !loading) {
    return <NotFoundPage />;
  }

  return (
    <div className={styles.directorySectionItemPage}>
      <span className={styles.directorySectionItemPage__text}>
        <Link className={styles.directorySectionItemPage__text__link} to={`/guide`}>
          Справочник
        </Link>
        &nbsp;/{' '}
        <Link className={styles.directorySectionItemPage__text__link} to={`/guide/${sectionName}`}>
          {currentSection.name}
        </Link>{' '}
        / <span>{currentSectionItem.name}</span>
      </span>
      <div className={styles.directorySectionItemPage__container}>
        <img
          loading="lazy"
          className={styles.directorySectionItemPage__container__img}
          src={currentSectionItem.img}
        />
        <div className={styles.directorySectionItemPage__container__description}>
          <h2 className={styles.directorySectionItemPage__container__description__heading}>
            {currentSectionItem.name}
          </h2>
          <div className={styles.directorySectionItemPage__container__description__container}>
            <span
              className={styles.directorySectionItemPage__container__description__container__text}>
              Пищевая ценность на порцию:
            </span>
            <div
              className={
                styles.directorySectionItemPage__container__description__container__structure
              }>
              <div
                className={
                  styles.directorySectionItemPage__container__description__container__structure__energy
                }>
                <span>Энергия</span>
                <span>{currentSectionItem.calorieContent}</span>
              </div>
              <div
                className={
                  styles.directorySectionItemPage__container__description__container__structure__protein
                }>
                <span>Белки</span>
                <span>{currentSectionItem.protein}</span>
              </div>
              <div
                className={
                  styles.directorySectionItemPage__container__description__container__structure__fats
                }>
                <span>Жиры</span>
                <span>{currentSectionItem.fats}</span>
              </div>
              <div
                className={
                  styles.directorySectionItemPage__container__description__container__structure__carbohydrates
                }>
                <span>Углеводы</span>
                <span>{currentSectionItem.carbohydrates}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p>{currentSectionItem.description}</p>
      <h3 className={styles.directorySectionItemPage__heading}>Полезные свойства</h3>
      <p>{currentSectionItem.benefit}</p>
      <h4 className={styles.directorySectionItemPage__heading}>Применения</h4>
      <p>{currentSectionItem.application}</p>
      <SectionCards
        foods={recipesData.slice(0, 8)}
        className={styles.directorySectionItemPage__cards}
        ogrinicator={true}
        heading={`Рецепты из ${getGenitive(currentSectionItem.name)}`}
      />
      <Comments
        disabled={!hasData}
        className={styles.directorySectionItemPage__coments}
        comments={currentSectionItem.comments || []}
        commentText={comment}
        setCommentText={setCommentText}
        sendComment={sendComment}
        answerSelectUser={answerSelectUser}
        userAnswerName={answer.name}
      />
      <Mailing />
    </div>
  );
}
