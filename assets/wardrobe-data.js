export const wardrobeItems = [
 {id:'lilac',name:'Лиловый пуховик',detail:'Lakers / градиент',category:'Пуховик',image:'assets/img/wardrobe/item-603.webp',look:'assets/img/wardrobe/polya-lilac-v2.webp',source:'https://t.me/RareLOSNEAKERS/603',description:'Лиловый градиент, объёмная стёжка и высокий воротник. Позиция из подборки магазина.',tone:'Лиловый',number:'01'},
 {id:'blue',name:'Синяя парка',detail:'Canada Goose / парка',category:'Парка',image:'assets/img/wardrobe/item-606.webp',look:'assets/img/wardrobe/polya-blue-v1.webp',source:'https://t.me/RareLOSNEAKERS/606',description:'Яркая синяя парка с капюшоном и накладными карманами. Позиция из подборки магазина.',tone:'Синий',number:'02'},
 {id:'fleece',name:'Голубой флис',detail:'The North Face / флис',category:'Флис',image:'assets/img/wardrobe/item-607.webp',look:'assets/img/wardrobe/polya-fleece-v1.webp',source:'https://t.me/RareLOSNEAKERS/607',description:'Фактурный голубой флис с воротником-стойкой. На исходном фото показана спинка.',tone:'Голубой',number:'03'}
];
export function cycleWardrobe(index,step,length=wardrobeItems.length){return((index+step)%length+length)%length;}
