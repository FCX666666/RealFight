import router from 'vue-router';
import Vue from 'vue'
Vue.use(router)
// const Home = () => import('views/home/Home')
const Category = () => import('views/category/category')
const Cart = () => import('views/cart/cart')
const Profile = () => import('views/profile/profile')
const Detail = () => import('views/detail/Detail')

const routes = [{
  path: '/test',
  redirect: '/profile/200/zhangsan',
}, {
  path: '/category',
  component: Category
}, {
  path: '/cart',
  component: Cart
}, {
  path: '/profile/:id/:name',
  component: Profile
}, {
  name:'detail',
  path: '/detail',
  component: Detail
}];

export default new router({
  routes
})
