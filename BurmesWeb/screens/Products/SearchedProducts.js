import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const SearchedProducts = ({ productsFiltered, onProductPress }) => {
  return (
    <ScrollView style={styles.container} nestedScrollEnabled={true}>
      {productsFiltered && productsFiltered.length > 0 ? (
        productsFiltered.map((item) => (
          <TouchableOpacity
            key={item._id?.$oid || item.id}
            style={styles.productItem}
            onPress={() => onProductPress && onProductPress(item)}
          >
            <Image
              source={{
                uri: item.image
                  ? item.image
                  : "https://bobbywhite.com/cdn/shop/products/Lionfront.jpg?v=1635864807&width=1080",
              }}
              style={styles.thumbnail}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
              {item.price && (
                <Text style={styles.productPrice}>
                  ${item.price.toLocaleString()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.center}>
          <Text style={styles.noResultsText}>No products found</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
    backgroundColor: "#ffffff",
  },
  productItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#ffffff",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 4,
  },
  center: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});

export default SearchedProducts;
