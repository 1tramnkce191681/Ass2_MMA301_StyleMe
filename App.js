//Ngô Kim Trâm_CE191681
import { useContext } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartContext, CartProvider } from './src/context/CartContext';

import AISuggestScreen from './src/screens/AISuggestScreen';
import CartScreen from './src/screens/CartScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import WishlistScreen from './src/screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  if (name === 'home') {
    return (
      <View style={tabIconStyles.container}>
        <View style={[tabIconStyles.roof, { borderBottomColor: color }]} />
        <View
          style={[
            tabIconStyles.homeBody,
            {
              borderColor: color,
              backgroundColor: focused ? color : 'transparent',
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'stylist') {
    return (
      <View style={tabIconStyles.container}>
        <Text style={[tabIconStyles.sparkleText, { color }]}>
          {focused ? '✦' : '✧'}
        </Text>
      </View>
    );
  }

  if (name === 'cart') {
    return (
      <View style={tabIconStyles.container}>
        <View style={[tabIconStyles.bagHandle, { borderColor: color }]} />
        <View
          style={[
            tabIconStyles.bagBody,
            {
              borderColor: color,
              backgroundColor: focused ? color : 'transparent',
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'wishlist') {
    return (
      <View style={tabIconStyles.container}>
        <Text
          style={[
            tabIconStyles.heartText,
            { color, fontWeight: focused ? '700' : '400' },
          ]}
        >
          {focused ? '♥' : '♡'}
        </Text>
      </View>
    );
  }

  if (name === 'notifications') {
    return (
      <View style={tabIconStyles.container}>
        <View style={[tabIconStyles.bellTop, { backgroundColor: color }]} />
        <View
          style={[
            tabIconStyles.bellDome,
            {
              borderColor: color,
              backgroundColor: focused ? color : 'transparent',
            },
          ]}
        />
        <View style={[tabIconStyles.bellRim, { backgroundColor: color }]} />
        <View style={[tabIconStyles.bellClapper, { backgroundColor: color }]} />
      </View>
    );
  }

  return null;
}

const tabIconStyles = StyleSheet.create({
  container: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    width: 12,
    height: 9,
    borderWidth: 1.5,
    borderTopWidth: 0,
  },
  sparkleText: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  bagHandle: {
    width: 8,
    height: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -1,
  },
  bagBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2.5,
  },
  heartText: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  bellTop: {
    width: 3,
    height: 2,
    borderRadius: 1,
    marginBottom: 0.5,
  },
  bellDome: {
    width: 12,
    height: 9,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bellRim: {
    width: 15,
    height: 1.8,
    borderRadius: 1,
  },
  bellClapper: {
    width: 3,
    height: 2,
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    marginTop: 0.5,
  },
});

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#25372e',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Catalog" component={ProductListScreen} options={{ title: 'Danh Sách Sản Phẩm' }} />
      <Stack.Screen name="Detail" component={ProductDetailScreen} options={{ title: 'Chi Tiết Sản Phẩm' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { totalItemCount } = useContext(CartContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#25372e',
        tabBarInactiveTintColor: '#9e9d96',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#ebe7df',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconType;
          if (route.name === 'HomeTab') {
            iconType = 'home';
          } else if (route.name === 'AIStylistTab') {
            iconType = 'stylist';
          } else if (route.name === 'CartTab') {
            iconType = 'cart';
          } else if (route.name === 'WishlistTab') {
            iconType = 'wishlist';
          } else if (route.name === 'NotificationsTab') {
            iconType = 'notifications';
          }
          return <TabIcon name={iconType} focused={focused} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="AIStylistTab"
        component={AISuggestScreen}
        options={{ title: 'AI Stylist' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Giỏ hàng',
          headerShown: true,
          tabBarBadge: totalItemCount > 0 ? totalItemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#8c7652',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { color: '#25372e', fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{
          title: 'Yêu thích',
          headerTitle: 'Yêu thích & đơn hàng',
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { color: '#25372e', fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationScreen}
        options={{ title: 'Thông báo' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </CartProvider>
  );
}