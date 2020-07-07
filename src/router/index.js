import router from 'vue-router';
import vue from 'vue'

const routerPush = router.prototype.push
router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(error=> error)
}

vue.use(router);

const Home = () => import('views/home/Home')
const Category = () => import('views/category/Category')
const Cart = () => import('views/cart/Cart')
const Profile = () => import('views/profile/Profile')

const routes = [{
  path: '*',
  redirect: '/home',
}, {
  path: '/home',
  component: Home
}, {
  path: '/category',
  component: Category
}, {
  path: '/cart',
  component: Cart
}, {
  path: '/profile',
  component: Profile
}];

export default new router({
  routes,
  mode: 'history'
})
