import styles from './RecipePage.module.css';
import { RecipeStep } from '@/shared/ui/widgets/RecipeStep';
import {
  PepperIcon,
  LikeIcon,
  ComplexityIcon,
  EyeIcon,
  StarIcon,
  ShareIcon,
  Bookmark,
  ExclamationMarkIcon,
  VKIcon,
  OKIcon,
  TGIcon,
  WhatsappIcon,
} from '@/shared/ui/icons';
import { IconActive } from '@/shared/ui/iconActive';
import { TagInTheRecipe } from '@/shared/ui/widgets/tagInTheRecipe';
import { AdditionalIngredientsItem } from '@/shared/ui/widgets/AdditionalIngredientsItem';
import { DefaultButton } from '@/shared/ui/buttons/defaultButton';
import { useState, useEffect, useRef } from 'react';
import { ShopList } from '@/shared/ui/widgets/ShopList';
import { IconLink } from '../../iconLinks/iconLink';
import { SectionCards } from '@/shared/ui/widgets/SectionCards';
import { Comments } from '@/shared/ui/widgets/Comments';
import { Mailing } from '../../widgets/Mailing';
import { AddRecipeInBookModal } from '@/shared/ui/widgets/AddRecipeInBookModal';
import { useParams, Link } from 'react-router-dom';
import { NotFoundPage } from '../NotFoundPage';
import type { FoodsState } from '@/store/foodsListSlice';
import type { RootState, AppDispatch } from '@/store';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateFood,
  updateFoodViews,
  updateFoodStars,
  updateFoodComments,
} from '@/store/foodsListSlice';
import { openAuthModal, updateUser } from '@/store/userSlice';
import type { Stars, Cookbook } from '@/types/users';
import type { FoodComment, FoodCommentAnswer, FoodStars } from '@/types/foods';

type JsonIngredient = {
  step: number[];
  [name: string]: string | number[];
};

type AdditionalIngredientData = {
  img: string;
  description: string;
  url: string;
};

type AdditionalIngredients = Record<string, AdditionalIngredientData>;

export default function RecipePage() {
  const [isVisible, setIsVisible] = useState('none');
  const [copied, setCopied] = useState<boolean>(false);
  const [addMarkBook, setAddMarkBook] = useState(false);
  const [addIngrenients, setAddIngrerdients] = useState<AdditionalIngredients>();
  const { foods }: FoodsState = useSelector<RootState, FoodsState>((state) => state.foodsList);
  const [comment, setComment] = useState('');
  const [answer, setAnswer] = useState({ value: false, id: 0, name: '' });

  const idRecipe = useParams<{ recipeId: string | undefined }>();
  const recipes = foods.filter((x) => x.id == +idRecipe.recipeId!)[0];
  const userState = useSelector((state: RootState) =>
    'id' in state.user.userData ? state.user.userData.id : undefined,
  );
  const hasData = !!userState;
  const dispatch = useDispatch<AppDispatch>();

  function setCommentText(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComment(e.target.value);
  }

  useEffect(() => {
    const loadData = async () => {
      const res = await fetch('/api/additionalIngredients');
      if (!res.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await res.json();
      setAddIngrerdients(data);
    };
    loadData();
  }, []);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsVisible('none');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!recipes) return;
    dispatch(
      updateFoodViews({
        id: recipes.id,
        views: recipes.views + 1,
      }),
    );
  }, [recipes?.id]);

  const isLikedData = useSelector((state: RootState) =>
    'liked' in state.user.userData ? state.user.userData.liked : undefined,
  );
  const isLiked = isLikedData?.includes(recipes.id) ?? false;

  const commentsRecipe = recipes.comments;

  const stars = useSelector((state: RootState) =>
    'stars' in state.user.userData ? state.user.userData.stars : undefined,
  );
  const starValue = stars?.find((i: Stars) => i.id === recipes.id);

  const favorites = useSelector((state: RootState) =>
    'cookbooks' in state.user.userData ? state.user.userData.cookbooks : undefined,
  );
  const recipeFavorites =
    favorites?.some((item: Cookbook) => item.recipes.some((i: number) => i === recipes.id)) ??
    false;

  if (!recipes) {
    return <NotFoundPage />;
  }

  function removeFavorite() {
    const newCookbook = favorites
      ? favorites.map((item: Cookbook) => ({
          ...item,
          recipes: item.recipes.filter((i: number) => i !== recipes.id),
        }))
      : undefined;
    if (userState) {
      dispatch(
        updateUser({
          userData: {
            id: userState,
            cookbooks: newCookbook,
          },
        }),
      );
    }
  }

  function getCurrentDate() {
    return Date.now();
  }

  function sendComment() {
    if (userState === undefined) {
      return;
    }
    if (comment.trim().length !== 0) {
      if (answer.id !== 0 && !answer.value) {
        const date = getCurrentDate();
        const newComment = {
          date,
          user: { id: userState },
          comment: comment,
          replyTo: answer.id,
        };
        const comments = recipes.comments?.map((i: FoodComment) => {
          if (i.date === answer.id) {
            return { ...i, answers: [...(i.answers ?? []), newComment] };
          }
          return i;
        });
        dispatch(
          updateFoodComments({
            id: recipes.id,
            comments: comments ?? [],
          }),
        );
        setComment('');
        setAnswer({ value: false, id: 0, name: '' });
      } else if (answer.id !== 0 && answer.value) {
        const date = getCurrentDate();
        const newComment = {
          date,
          user: { id: userState },
          comment: comment,
          replyTo: answer.id,
        };
        const comments = recipes.comments?.map((i: FoodComment) => {
          if (i.answers && i.answers.some((item: FoodCommentAnswer) => item.date === answer.id)) {
            return { ...i, answers: [...(i.answers ?? []), newComment] };
          }
          return i;
        });
        dispatch(
          updateFoodComments({
            id: recipes.id,
            comments: comments ?? [],
          }),
        );
        setComment('');
        setAnswer({ value: false, id: 0, name: '' });
      } else {
        if (userState === undefined) {
          return;
        }
        const date = getCurrentDate();
        const newComment = {
          date,
          user: { id: userState },
          comment: comment,
          answers: [],
        };
        dispatch(
          updateFoodComments({
            id: recipes.id,
            comments: [newComment, ...(commentsRecipe ?? [])],
          }),
        );
        setComment('');
      }
    }
  }

  function answerSelectUser(value: boolean, id: number, name: string) {
    setAnswer({ value: value, id: id, name: name });
  }
  // копирование ссылки
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      fallbackCopyTextToClipboard(window.location.href);
    }
  };
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  function clickMarkBook() {
    if (!hasData) {
      dispatch(openAuthModal());
    } else {
      if (recipeFavorites) {
        removeFavorite();
      } else {
        setAddMarkBook(true);
      }
    }
  }

  function clickStar(number: number) {
    if (!hasData) {
      dispatch(openAuthModal());
      return;
    }

    const userRecipeStar = stars?.find((item: Stars) => item.id === recipes.id);

    // 1. У пользователя вообще нет оценок
    if (!stars || stars.length === 0) {
      const newStars = recipes.stars.map((item: FoodStars) => {
        const key = Object.keys(item)[0];

        if (Number(key) === number) {
          return { [key]: item[key] + 1 };
        }

        return item;
      });

      dispatch(
        updateFoodStars({
          id: recipes.id,
          stars: newStars,
        }),
      );

      dispatch(
        updateUser({
          userData: {
            id: userState,
            stars: [{ id: recipes.id, stars: number }],
          },
        }),
      );

      return;
    }

    // 2. У пользователя есть оценки, но текущего рецепта среди них нет
    if (!userRecipeStar) {
      const newStars = recipes.stars.map((item: FoodStars) => {
        const key = Object.keys(item)[0];

        if (Number(key) === number) {
          return { [key]: item[key] + 1 };
        }

        return item;
      });

      dispatch(
        updateFoodStars({
          id: recipes.id,
          stars: newStars,
        }),
      );

      dispatch(
        updateUser({
          userData: {
            id: userState,
            stars: [
              ...stars,
              {
                id: recipes.id,
                stars: number,
              },
            ],
          },
        }),
      );

      return;
    }

    // 3. Оценка совпадает — убираем оценку
    if (userRecipeStar.stars === number) {
      const newStars = recipes.stars.map((item: FoodStars) => {
        const key = Object.keys(item)[0];

        if (Number(key) === number) {
          return { [key]: item[key] - 1 };
        }

        return item;
      });

      dispatch(
        updateFoodStars({
          id: recipes.id,
          stars: newStars,
        }),
      );

      dispatch(
        updateUser({
          userData: {
            id: userState,
            stars: stars.filter((item: Stars) => item.id !== recipes.id),
          },
        }),
      );
      return;
    }

    // 4. Оценка другая — убираем старую и добавляем новую
    const oldStar = userRecipeStar.stars;

    const newStars = recipes.stars.map((item: FoodStars) => {
      const key = Object.keys(item)[0];

      if (Number(key) === oldStar) {
        return { [key]: item[key] - 1 };
      }

      if (Number(key) === number) {
        return { [key]: item[key] + 1 };
      }

      return item;
    });

    dispatch(
      updateFoodStars({
        id: recipes.id,
        stars: newStars,
      }),
    );

    dispatch(
      updateUser({
        userData: {
          id: userState,
          stars: stars.map((item: Stars) => {
            if (item.id === recipes.id) {
              return {
                ...item,
                stars: number,
              };
            }

            return item;
          }),
        },
      }),
    );
  }

  function clickLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!hasData) {
      dispatch(openAuthModal());
    } else {
      if (isLikedData) {
        const newLiked = isLiked
          ? isLikedData.filter((i: number) => i !== recipes.id)
          : [...isLikedData, recipes.id];
        dispatch(updateUser({ userData: { id: userState, liked: newLiked } }));
        dispatch(
          updateFood({ id: recipes.id, likes: isLiked ? recipes.likes - 1 : recipes.likes + 1 }),
        );
      }
    }
  }

  const addIngredients = addIngrenients as AdditionalIngredients;
  let textComplexity;
  if (recipes.complexity == 'easy') {
    textComplexity = 'лёгкая';
  } else if (recipes.complexity == 'normal') {
    textComplexity = 'средняя';
  } else {
    textComplexity = 'высокая';
  }
  let time: 'easy' | 'normal' | 'hard';
  if (recipes.prepTime <= 30) {
    time = 'easy';
  } else if (recipes.prepTime <= 60) {
    time = 'normal';
  } else {
    time = 'hard';
  }
  const result = recipes.stars.reduce((sum, obj) => {
    const [key, value] = Object.entries(obj)[0];
    return sum + Number(key) * value;
  }, 0);
  const usersCount = recipes.stars.reduce((sum, obj) => {
    const value = Number(Object.values(obj)[0]);
    return sum + value;
  }, 0);
  const ratingValue = result / usersCount;
  const dishes: string[] = [];
  recipes.inventory.forEach((item) => dishes.push(item.name));

  const handleClickIng = (item: string) => {
    setIsVisible((prev) => (prev === item ? 'none' : item));
  };

  return (
    <>
      <div className={styles.recipePage}>
        <p className={styles.recipePage__heading}>
          <Link className={styles.recipePage__heading__link} to={'/'}>
            Главная
          </Link>{' '}
          /{' '}
          <Link className={styles.recipePage__heading__link} to={'/catalog'}>
            Каталог рецептов
          </Link>{' '}
          / <span>{recipes.name}</span>
        </p>
        <div className={styles.recipePage__recipe}>
          <div className={styles.recipePage__recipe__imgEndShoplist}>
            <img
              loading="lazy"
              className={styles.recipePage__recipe__imgEndShoplist__img}
              src={recipes.image}
            />
            <div className={styles.recipePage__recipe__imgEndShoplist__ingredients}>
              <h2 className={styles.recipePage__recipe__imgEndShoplist__ingredients__heading}>
                Ингредиенты:
              </h2>
              <div className={styles.recipePage__recipe__imgEndShoplist__ingredients__text}>
                <div
                  className={
                    styles.recipePage__recipe__imgEndShoplist__ingredients__text__container
                  }>
                  <ExclamationMarkIcon />
                  <span>Дополнительные ингредиенты</span>
                </div>
                <div
                  className={styles.recipePage__recipe__imgEndShoplist__ingredients__text__addIng}>
                  {recipes.additionalIngredients.map((item) => (
                    <div key={item} className={styles.modal__addIng}>
                      <AdditionalIngredientsItem text={item} onClick={() => handleClickIng(item)} />
                      {isVisible === item && (
                        <div
                          ref={popupRef}
                          className={
                            styles.recipePage__recipe__imgEndShoplist__ingredients__text__addIng__modal
                          }>
                          <div className={styles.modal__imageWrapper}>
                            <img
                              loading="lazy"
                              className={styles.modal__imageWrapper}
                              src={addIngredients[item].img}
                            />
                          </div>
                          <div className={styles.arrow__modal}></div>
                          <div className={styles.modal__text}>
                            <h3>{item}</h3>
                            <span>ингредиент</span>
                            <p className={styles.modal__description}>
                              {addIngredients[item].description}
                            </p>
                            <DefaultButton
                              className={styles.modal__button}
                              text="Читать больше"
                              handleClick={() => window.open(addIngredients[item].url, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <ShopList id={recipes.id} baseItem={recipes.ingredients as JsonIngredient[]} />
            </div>
            <div className={styles.recipePage__recipe__imgEndShoplist__tags}>
              <h3>Теги:</h3>
              <div className={styles.recipePage__recipe__imgEndShoplist__tags__list}>
                {recipes.tagsSearch.map((item) => (
                  <div
                    key={item}
                    className={styles.recipePage__recipe__imgEndShoplist__tags__list__item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.recipePage__recipe__detailsRecipe}>
            <div className={styles.container__details}>
              <h1 className={styles.recipePage__recipe__detailsRecipe__heading}>{recipes.name}</h1>
              <div className={styles.container__details__container}>
                <div className={styles.container__details__tags}>
                  {recipes.tags.map((item) => (
                    <TagInTheRecipe key={item} text={item} />
                  ))}
                </div>
                <div className={styles.container__details__container__icons}>
                  <IconActive
                    handleClick={() => clickMarkBook()}
                    svg={<Bookmark active={recipeFavorites} color={'rgba(255, 167, 86, 1)'} />}
                  />
                  <IconActive handleClick={() => handleShare()} svg={<ShareIcon />} />
                  <p
                    style={{ opacity: copied ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
                    className={styles.container__details__container__icons__text}>
                    Ссылка скопирована в буфер обмена
                  </p>
                </div>
              </div>
              <div className={styles.container__details__parameters}>
                <div className={styles.container__details__parameters__complexity}>
                  <h2 className={styles.container__details__parameters__complexity__heading}>
                    Готовность
                  </h2>
                  <div className={styles.container__details__parameters__complexity__svg}>
                    <ComplexityIcon complexity={time} />
                    <span className={styles.text__svg}>{`${recipes.prepTime}\nминут`}</span>
                  </div>
                </div>
                <div className={styles.container__details__parameters__complexity}>
                  <h2 className={styles.container__details__parameters__complexity__heading}>
                    Сложность
                  </h2>
                  <div className={styles.container__details__parameters__complexity__svg}>
                    <ComplexityIcon complexity={recipes.complexity as 'easy' | 'normal' | 'hard'} />
                    <span className={styles.text__svg}>{textComplexity}</span>
                  </div>
                </div>
                <div className={styles.container__details__parameters__sharpness}>
                  <h2 className={styles.container__details__parameters__complexity__heading}>
                    Острота
                  </h2>
                  {recipes.sharpness === 1 ? (
                    <div className={styles.container__details__parameters__sharpness__icons}>
                      <PepperIcon className={styles.icon__pepper} active={true} />
                      <PepperIcon className={styles.icon__pepper} />
                      <PepperIcon className={styles.icon__pepper} />
                    </div>
                  ) : recipes.sharpness === 2 ? (
                    <div className={styles.container__details__parameters__sharpness__icons}>
                      <PepperIcon className={styles.icon__pepper} active={true} />
                      <PepperIcon className={styles.icon__pepper} active={true} />
                      <PepperIcon className={styles.icon__pepper} />
                    </div>
                  ) : (
                    <div className={styles.container__details__parameters__sharpness__icons}>
                      <PepperIcon className={styles.icon__pepper} active={true} />
                      <PepperIcon className={styles.icon__pepper} active={true} />
                      <PepperIcon className={styles.icon__pepper} active={true} />
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.container__details__value}>
                <h2 className={styles.container__details__value__heading}>
                  Пищевая ценность на порцию:
                </h2>
                <div className={styles.container__details__value__container}>
                  <div className={styles.container__details__value__container__energy}>
                    <div className={styles.container__details__value__container__energy__container}>
                      <span>Энергия</span>
                      <span>{recipes.energy}</span>
                    </div>
                  </div>
                  <div className={styles.container__details__value__container__squirrels}>
                    <div
                      className={styles.container__details__value__container__squirrels__container}>
                      <span>Белки</span>
                      <span>{recipes.squirrels}</span>
                    </div>
                  </div>
                  <div className={styles.container__details__value__container__fats}>
                    <div className={styles.container__details__value__container__fats__container}>
                      <span>Жиры</span>
                      <span>{recipes.squirrels}</span>
                    </div>
                  </div>
                  <div className={styles.container__details__value__container__carbohydrates}>
                    <div
                      className={
                        styles.container__details__value__container__carbohydrates__container
                      }>
                      <span>Углеводы</span>
                      <span>{recipes.carbohydrates}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.container__details__metrics}>
                <div className={styles.container__details__metrics__container}>
                  <div className={styles.container__details__metrics__container__like}>
                    <IconActive
                      handleClick={(e) => clickLike(e)}
                      svg={<LikeIcon active={isLiked} color="rgba(103, 187, 90, 1)" />}
                    />
                    <p>{`${recipes.likes} понравилось`}</p>
                  </div>
                  <div className={styles.container__details__metrics__container__eye}>
                    <EyeIcon className={styles.eyeicon} active={true} />
                    <p>{`${recipes.views} просмотров`}</p>
                  </div>
                </div>
                <div className={styles.container__details__metrics__star}>
                  <StarIcon active={true} />
                  <span>{`${ratingValue.toFixed(1)}`}</span>
                </div>
              </div>
            </div>
            <div className={styles.recipePage__recipe__description}>
              <div className={styles.recipePage__recipe__description__text}>
                <h2>Описание:</h2>
                <p>{recipes.description}</p>
              </div>
              <div className={styles.recipePage__recipe__description__dishes}>
                <h2>Посуда:</h2>
                <p>{dishes.join(', ')}</p>
              </div>
              {Array.from({ length: recipes.steps }, (_, i) => {
                const stepNum = i + 1;
                return (
                  <RecipeStep
                    step={i + 1}
                    key={i}
                    stepNum={`${stepNum} / ${recipes.steps}`}
                    stepData={recipes.descriptionStep[i]}
                    stepIngredients={recipes.ingredients as unknown as JsonIngredient[]}
                    stepInventory={recipes.inventorySteps.filter((item) => item.id == i + 1)}
                    inventory={recipes.inventory}
                  />
                );
              })}
              <div className={styles.recipePage__recipe__description__feedback}>
                <div className={styles.recipePage__recipe__description__feedback__container}>
                  <h4
                    className={
                      styles.recipePage__recipe__description__feedback__container__heading
                    }>
                    Вам понравился рецепт?
                  </h4>
                  <div
                    className={styles.recipePage__recipe__description__feedback__container__stars}>
                    <IconActive
                      handleClick={() => {
                        clickStar(1);
                      }}
                      svg={
                        <StarIcon
                          classPath={styles.stars}
                          active={starValue ? starValue?.stars > 0 : false}
                        />
                      }
                    />
                    <IconActive
                      handleClick={() => {
                        clickStar(2);
                      }}
                      svg={
                        <StarIcon
                          classPath={styles.stars}
                          active={starValue ? starValue?.stars > 1 : false}
                        />
                      }
                    />
                    <IconActive
                      handleClick={() => {
                        clickStar(3);
                      }}
                      svg={
                        <StarIcon
                          classPath={styles.stars}
                          active={starValue ? starValue?.stars > 2 : false}
                        />
                      }
                    />
                    <IconActive
                      handleClick={() => {
                        clickStar(4);
                      }}
                      svg={
                        <StarIcon
                          classPath={styles.stars}
                          active={starValue ? starValue?.stars > 3 : false}
                        />
                      }
                    />
                    <IconActive
                      handleClick={() => {
                        clickStar(5);
                      }}
                      svg={
                        <StarIcon
                          classPath={styles.stars}
                          active={starValue ? starValue?.stars > 4 : false}
                        />
                      }
                    />
                  </div>
                </div>
                <div className={styles.recipePage__recipe__description__feedback__list}>
                  <div
                    className={styles.recipePage__recipe__description__feedback__list__favourites}>
                    <IconActive
                      handleClick={() => clickMarkBook()}
                      svg={<Bookmark active={recipeFavorites} color={'rgba(247, 147, 30, 1)'} />}
                    />
                    <span>добавить в кулинарную книгу</span>
                  </div>
                  <div className={styles.recipePage__recipe__description__feedback__list__links}>
                    <span>поделиться</span>
                    <IconLink
                      href="https://vk.ru/vanek1499"
                      label="Ссылка на ВК"
                      svg={<VKIcon />}
                    />
                    <IconLink
                      href="https://vk.ru/vanek1499"
                      label="Ссылка на Одноклассники"
                      svg={<OKIcon />}
                    />
                    <IconLink
                      href="https://vk.ru/vanek1499"
                      label="Ссылка на Телеграмм"
                      svg={<TGIcon />}
                    />
                    <IconLink
                      href="https://vk.ru/vanek1499"
                      label="Ссылка на Вотсапп"
                      svg={<WhatsappIcon />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SectionCards
          foods={foods.slice(0, 8)}
          classNameHeading={styles.section__heading__text}
          ogrinicator={true}
          heading="Больше вкусных рецептов для вас"
        />
        <Comments
          userAnswerName={answer.name}
          answerSelectUser={answerSelectUser}
          disabled={!hasData}
          sendComment={sendComment}
          commentText={comment}
          setCommentText={setCommentText}
          comments={recipes.comments ? recipes.comments : []}
          className={styles.recipe__comments}
        />
        <Mailing />
      </div>
      {addMarkBook && (
        <AddRecipeInBookModal
          idRecipe={recipes.id}
          imgAlt={recipes.imgAlt}
          img={recipes.image}
          name={recipes.name}
          closeModal={() => setAddMarkBook((prev) => !prev)}
        />
      )}
    </>
  );
}
