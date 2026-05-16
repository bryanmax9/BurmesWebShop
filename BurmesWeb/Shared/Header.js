import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SearchedProducts from "../screens/Products/SearchedProducts";
import { useAuth } from "../contexts/AuthContext";

const categoriesData = require("../assets/data/categories.json");

const JOYAS_CATEGORIES = [
  { name: "pendants",  label: "DIJES" },
  { name: "chains",    label: "CADENAS" },
  { name: "rings",     label: "ANILLOS" },
  { name: "bracelets", label: "PULSERAS" },
  { name: "aretes",    label: "ARETES" },
  { name: "relojes",   label: "RELOJES" },
];

const JOYAS_GENDER_GROUPS = [
  { key: "hombre",      label: "HOMBRES" },
  { key: "mujer",       label: "MUJERES" },
  { key: "unisex",      label: "UNISEX" },
  { key: "ninos_bebes", label: "NIÑOS Y BEBÉS" },
];

const JOYAS_DISCOVER = [
  { key: "oro",     label: "COLECCIÓN ORO" },
  { key: "plata",   label: "COLECCIÓN PLATA" },
  { key: "zodiac",  label: "SIGNOS ZODIACALES" },
  { key: "letras",  label: "COLECCIÓN DE LETRAS" },
];

const JOYAS_GEMAS = [
  { key: "gemas_diamantes",  label: "DIAMANTES" },
  { key: "gemas_color",      label: "GEMAS DE COLOR" },
  { key: "gemas_nacimiento", label: "GEMAS DE NACIMIENTO" },
];

const COMPROMISO_ELLA = [
  { key: "compromiso-ella-anillos",  label: "ANILLOS DE COMPROMISO" },
  { key: "compromiso-ella-alianzas", label: "ALIANZAS" },
  { key: "compromiso-ella-conjuntos", label: "CONJUNTOS" },
  { key: "compromiso-ella-eternidad", label: "ANILLOS DE ETERNIDAD" },
];

const COMPROMISO_EL = [
  { key: "compromiso-el-argollas",  label: "ARGOLLAS MATRIMONIALES" },
  { key: "compromiso-el-alianzas",  label: "ALIANZAS" },
  { key: "compromiso-el-clasicos",  label: "DISEÑOS CLÁSICOS" },
  { key: "compromiso-el-modernos",  label: "DISEÑOS MODERNOS" },
];

// Default navigation items - can be overridden via props
const DEFAULT_NAV_ITEMS = [
  { id: "home",       label: "INICIO",     route: "home" },
  { id: "jewellery",  label: "JOYAS",      route: "jewellery" },
  { id: "engagement", label: "COMPROMISO", route: "engagement" },
  { id: "watches",    label: "RELOJES",    route: "watches" },
  { id: "gemas",      label: "GEMAS",      route: "gemas" },
];

const Header = ({
  navigationItems = DEFAULT_NAV_ITEMS,
  onNavigate,
  onProductPress,
  scrollY: externalScrollY,
  user,
  isAdmin = false,
  cartCount = 0,
  showCart = true,
  onSignOut,
  navigate,
}) => {
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window"),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [joyasMenuOpen, setJoyasMenuOpen] = useState(false);
  const [joyasFeatured, setJoyasFeatured] = useState([]);
  const [activeGender, setActiveGender] = useState(null);
  const joyasMenuAnim   = useState(new Animated.Value(0))[0];
  const joyasCloseTimer = useRef(null);

  const [gemasMenuOpen, setGemasMenuOpen] = useState(false);
  const gemasMenuAnim   = useState(new Animated.Value(0))[0];
  const gemasCloseTimer = useRef(null);

  const [compromisMenuOpen, setCompromisMenuOpen] = useState(false);
  const compromisMenuAnim   = useState(new Animated.Value(0))[0];
  const compromisCloseTimer = useRef(null);
  const [compromisHover, setCompromisHover] = useState(null); // "ella" | "el" | null
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalScrollY, setInternalScrollY] = useState(0);
  const [productsFiltered, setProductsFiltered] = useState([]);
  const [products, setProducts] = useState([]);
  const { getProducts } = useAuth();

  // Use external scrollY if provided, otherwise use internal
  const scrollY =
    externalScrollY !== undefined ? externalScrollY : internalScrollY;

  // Load products on mount from Firestore
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await (getProducts?.() ?? Promise.resolve([]));
        if (!cancelled) setProducts(list || []);
      } catch (e) {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getProducts]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = products.filter((product) => {
        const query = searchQuery.toLowerCase();
        return (
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query)
        );
      });
      setProductsFiltered(filtered);
    } else {
      setProductsFiltered([]);
    }
  }, [searchQuery, products]);

  // Set up resize listener for dynamic updates
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
      // Close menu when screen size changes to large
      if (window.width >= 768) {
        setMenuOpen(false);
      }
    });

    return () => subscription?.remove();
  }, []);

  // Simple scroll listener for header opacity
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleScroll = () => {
        // Try multiple methods to get scroll position
        const currentScrollY =
          window.scrollY ||
          window.pageYOffset ||
          (document.documentElement && document.documentElement.scrollTop) ||
          (document.body && document.body.scrollTop) ||
          0;
        setInternalScrollY(currentScrollY);
      };

      // Set initial value
      handleScroll();

      // Use requestAnimationFrame for smoother updates
      let ticking = false;
      const optimizedScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };

      // Listen to scroll on window
      if (window.addEventListener) {
        window.addEventListener("scroll", optimizedScroll, { passive: true });
        window.addEventListener("wheel", optimizedScroll, { passive: true });
      }

      // Also listen on document for better compatibility
      if (document && document.addEventListener) {
        document.addEventListener("scroll", optimizedScroll, { passive: true });
      }

      return () => {
        if (window.removeEventListener) {
          window.removeEventListener("scroll", optimizedScroll);
          window.removeEventListener("wheel", optimizedScroll);
        }
        if (document && document.removeEventListener) {
          document.removeEventListener("scroll", optimizedScroll);
        }
      };
    }
  }, []);

  useEffect(() => {
    Animated.timing(joyasMenuAnim, {
      toValue: joyasMenuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [joyasMenuOpen]);

  const openJoyasMenu = () => {
    if (joyasCloseTimer.current) clearTimeout(joyasCloseTimer.current);
    setGemasMenuOpen(false);
    setCompromisMenuOpen(false);
    setJoyasMenuOpen(true);
  };
  const scheduleCloseJoyasMenu = () => {
    joyasCloseTimer.current = setTimeout(() => { setJoyasMenuOpen(false); setActiveGender(null); }, 150);
  };

  useEffect(() => {
    Animated.timing(gemasMenuAnim, {
      toValue: gemasMenuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [gemasMenuOpen]);

  const openGemasMenu = () => {
    if (gemasCloseTimer.current) clearTimeout(gemasCloseTimer.current);
    setJoyasMenuOpen(false);
    setCompromisMenuOpen(false);
    setGemasMenuOpen(true);
  };
  const scheduleCloseGemasMenu = () => {
    gemasCloseTimer.current = setTimeout(() => setGemasMenuOpen(false), 150);
  };

  useEffect(() => {
    Animated.timing(compromisMenuAnim, {
      toValue: compromisMenuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [compromisMenuOpen]);

  const openCompromisMenu = () => {
    if (compromisCloseTimer.current) clearTimeout(compromisCloseTimer.current);
    setJoyasMenuOpen(false);
    setGemasMenuOpen(false);
    setCompromisMenuOpen(true);
  };
  const scheduleCloseCompromisMenu = () => {
    compromisCloseTimer.current = setTimeout(() => { setCompromisMenuOpen(false); setCompromisHover(null); }, 150);
  };

  useEffect(() => {
    if (!joyasMenuOpen || joyasFeatured.length > 0 || !getProducts) return;
    getProducts()
      .then((list) => {
        const featured = (list || []).filter((p) => p.isFeatured && (p.image || (Array.isArray(p.images) && p.images[0])));
        const toShow = featured.length >= 2 ? featured.slice(0, 2) : (list || []).filter((p) => p.image || (Array.isArray(p.images) && p.images[0])).slice(0, 2);
        setJoyasFeatured(toShow);
      })
      .catch(() => {});
  }, [joyasMenuOpen]);

  // Calculate opacity: 0.7 at top, 0.95 after 200px scroll
  const getOpacity = () => {
    const maxScroll = 200;
    const minOpacity = 0.7;
    const maxOpacity = 0.95;

    if (scrollY <= 0) return minOpacity;
    if (scrollY >= maxScroll) return maxOpacity;

    return minOpacity + (scrollY / maxScroll) * (maxOpacity - minOpacity);
  };

  const isSmallScreen = windowDimensions.width < 768;

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 30;
    return 40;
  };

  const getContainerPaddingVertical = () => {
    if (windowDimensions.width < 768) return 15; // Less vertical padding on small screens
    return 20; // Less padding on large screens
  };

  const getContainerPaddingTop = () => {
    if (windowDimensions.width < 768) return 50; // More top padding on mobile for status bar
    return 0; // No extra top padding on large screens
  };

  const getBrandNameStyle = () => {
    if (windowDimensions.width < 600) {
      return {
        fontSize: 20,
        minWidth: 0,
        flex: 1,
        letterSpacing: 1,
      };
    } else if (windowDimensions.width < 768) {
      return {
        fontSize: 24,
        minWidth: 0,
        flex: 1,
        letterSpacing: 1.5,
      };
    }
    return {};
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: getContainerPadding(),
            paddingTop:
              getContainerPaddingTop() || getContainerPaddingVertical(),
            paddingBottom: getContainerPaddingVertical(),
            backgroundColor: `rgba(0, 0, 0, ${getOpacity()})`,
            ...(Platform.OS === "web" && {
              // React Native Web supports CSS transitions as inline styles
              transition: "background-color 0.3s ease-out",
            }),
          },
        ]}
      >
        {/* Brand Name - Left */}
        <TouchableOpacity
          onPress={() => onNavigate && onNavigate("home")}
          activeOpacity={0.7}
        >
          <Text style={[styles.brandName, getBrandNameStyle()]}>
            BURMES & CO.
          </Text>
        </TouchableOpacity>

        {/* Navigation Menu - Center (hidden on small screens) */}
        {!isSmallScreen && navigationItems.length > 0 && (
          <View style={styles.navMenu}>
            {navigationItems.map((item, index) => {
              if (item.id === "jewellery") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    onMouseEnter={openJoyasMenu}
                    onMouseLeave={scheduleCloseJoyasMenu}
                    onPress={openJoyasMenu}
                  >
                    <Text style={[styles.navItem, joyasMenuOpen && styles.navItemActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
              if (item.id === "gemas") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    onMouseEnter={openGemasMenu}
                    onMouseLeave={scheduleCloseGemasMenu}
                    onPress={openGemasMenu}
                  >
                    <Text style={[styles.navItem, gemasMenuOpen && styles.navItemActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
              if (item.id === "engagement") {
                return (
                  <TouchableOpacity
                    key={item.id}
                    onMouseEnter={openCompromisMenu}
                    onMouseLeave={scheduleCloseCompromisMenu}
                    onPress={openCompromisMenu}
                  >
                    <Text style={[styles.navItem, compromisMenuOpen && styles.navItemActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={item.id || index}
                  onPress={() => { setJoyasMenuOpen(false); setGemasMenuOpen(false); onNavigate && onNavigate(item.route); }}
                >
                  <Text style={styles.navItem}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Right Side - Icons or Menu Button */}
        <View style={styles.rightContainer}>
          {isSmallScreen ? (
            <View style={styles.mobileHeaderIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSearchOpen(!searchOpen)}
              >
                <Ionicons name="search-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              {navigate && showCart && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigate("/cart")}
                >
                  <View>
                    <Ionicons name="cart-outline" size={24} color="#ffffff" />
                    {cartCount > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              {navigate && (
                <View style={styles.profileIconWrap}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setMenuOpen(false);
                      setProfileDropdownOpen((v) => !v);
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={28} color="#ffffff" />
                  </TouchableOpacity>
                  {profileDropdownOpen && (
                    <>
                      <Pressable
                        style={styles.dropdownBackdrop}
                        onPress={() => setProfileDropdownOpen(false)}
                      />
                      <View style={[styles.profileDropdown, styles.profileDropdownMobile]}>
                        {user ? (
                          <>
                            {!isAdmin && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  navigate("/client/dashboard");
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Mis pedidos</Text>
                              </TouchableOpacity>
                            )}
                            {isAdmin && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  navigate("/admin/dashboard");
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Panel de administración</Text>
                              </TouchableOpacity>
                            )}
                            {onSignOut && (
                              <TouchableOpacity
                                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  onSignOut();
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Cerrar sesión</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                setProfileDropdownOpen(false);
                                navigate("/sign-in");
                              }}
                            >
                              <Text style={styles.dropdownItemText}>Iniciar sesión</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                setProfileDropdownOpen(false);
                                navigate("/sign-up");
                              }}
                            >
                              <Text style={styles.dropdownItemText}>Registrarse</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuOpen(!menuOpen)}
              >
                <Ionicons name="menu" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.iconsContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSearchOpen(!searchOpen)}
              >
                <Ionicons name="search-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              {navigate && showCart && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigate("/cart")}
                >
                  <View>
                    <Ionicons name="cart-outline" size={24} color="#ffffff" />
                    {cartCount > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              {navigate && (
                <View style={styles.profileIconWrap}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setProfileDropdownOpen((v) => !v)}
                  >
                    <Ionicons name="person-circle-outline" size={28} color="#ffffff" />
                  </TouchableOpacity>
                  {profileDropdownOpen && (
                    <>
                      <Pressable
                        style={styles.dropdownBackdrop}
                        onPress={() => setProfileDropdownOpen(false)}
                      />
                      <View style={styles.profileDropdown}>
                        {user ? (
                          <>
                            {!isAdmin && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  navigate("/client/dashboard");
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Mis pedidos</Text>
                              </TouchableOpacity>
                            )}
                            {isAdmin && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  navigate("/admin/dashboard");
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Panel de administración</Text>
                              </TouchableOpacity>
                            )}
                            {onSignOut && (
                              <TouchableOpacity
                                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                                onPress={() => {
                                  setProfileDropdownOpen(false);
                                  onSignOut();
                                }}
                              >
                                <Text style={styles.dropdownItemText}>Cerrar sesión</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                setProfileDropdownOpen(false);
                                navigate("/sign-in");
                              }}
                            >
                              <Text style={styles.dropdownItemText}>Iniciar sesión</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                setProfileDropdownOpen(false);
                                navigate("/sign-up");
                              }}
                            >
                              <Text style={styles.dropdownItemText}>Registrarse</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Joyas Megamenu */}
      {joyasMenuOpen && !isSmallScreen && (
        <>
          <Animated.View
            style={[
              styles.joyasMenu,
              {
                opacity: joyasMenuAnim,
                transform: [{
                  translateY: joyasMenuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                }],
              },
            ]}
            onMouseEnter={openJoyasMenu}
            onMouseLeave={scheduleCloseJoyasMenu}
          >
            <View style={styles.joyasMenuInner}>
              {/* Col 1: Gender groups */}
              <View style={styles.joyasMenuLinks}>
                <Text style={styles.joyasMenuColHeader}>BUSCAR POR</Text>
                {JOYAS_GENDER_GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    onMouseEnter={() => setActiveGender(g.key)}
                    onPress={() => { setJoyasMenuOpen(false); setActiveGender(null); if (navigate) navigate(`/coleccion/${g.key}`); }}
                  >
                    <Text style={[styles.joyasMenuLink, activeGender === g.key && styles.joyasMenuLinkActive]}>
                      {g.label} {activeGender === g.key ? "›" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Col 2: Category sub-panel (shown when a gender is hovered, else empty) */}
              <View style={[styles.joyasMenuLinks, { minWidth: 180, borderLeftWidth: activeGender ? 1 : 0, borderLeftColor: "#e0ddd8", paddingLeft: activeGender ? 24 : 0 }]}>
                {activeGender ? (
                  <>
                    <Text style={styles.joyasMenuColHeader}>CATEGORÍA</Text>
                    {JOYAS_CATEGORIES.map((cat) => {
                      const entry = (categoriesData || []).find((c) => c.name === cat.name);
                      const oid = entry?._id?.$oid || entry?._id;
                      return (
                        <TouchableOpacity
                          key={cat.name}
                          onPress={() => {
                            const g = activeGender;
                            setJoyasMenuOpen(false);
                            setActiveGender(null);
                            if (oid && navigate) navigate(`/category/${oid}`, { state: { genderFilter: g } });
                          }}
                        >
                          <Text style={styles.joyasMenuLink}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : null}
              </View>

              {/* Col 3: DESCUBRE */}
              <View style={styles.joyasMenuLinks}>
                <Text style={styles.joyasMenuColHeader}>DESCUBRE</Text>
                {JOYAS_DISCOVER.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => { setJoyasMenuOpen(false); setActiveGender(null); if (navigate) navigate(`/coleccion/${item.key}`); }}
                  >
                    <Text style={styles.joyasMenuLink}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Right: 2 featured product images */}
              <View style={styles.joyasMenuImages}>
                {joyasFeatured.slice(0, 2).map((product, i) => {
                  const imgUri = product.image || (Array.isArray(product.images) && product.images[0]) || null;
                  if (!imgUri) return null;
                  return (
                    <View key={i} style={styles.joyasMenuImgWrap}>
                      <Image source={{ uri: imgUri }} style={styles.joyasMenuImg} resizeMode="cover" />
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* Gemas Megamenu */}
      {gemasMenuOpen && !isSmallScreen && (
        <Animated.View
          style={[
            styles.joyasMenu,
            {
              opacity: gemasMenuAnim,
              transform: [{ translateY: gemasMenuAnim.interpolate({ inputRange: [0,1], outputRange: [-12,0] }) }],
            },
          ]}
          onMouseEnter={openGemasMenu}
          onMouseLeave={scheduleCloseGemasMenu}
        >
          <View style={[styles.joyasMenuInner, { gap: 40 }]}>
            <View style={styles.joyasMenuLinks}>
              <Text style={styles.joyasMenuColHeader}>TIPO DE GEMA</Text>
              {JOYAS_GEMAS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => { setGemasMenuOpen(false); if (navigate) navigate(`/coleccion/${item.key}`); }}
                >
                  <Text style={styles.joyasMenuLink}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Compromiso Megamenu */}
      {compromisMenuOpen && !isSmallScreen && (
        <Animated.View
          style={[
            styles.joyasMenu,
            {
              opacity: compromisMenuAnim,
              transform: [{ translateY: compromisMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            },
          ]}
          onMouseEnter={openCompromisMenu}
          onMouseLeave={scheduleCloseCompromisMenu}
        >
          <View style={styles.joyasMenuInner}>
            {/* Col 1: Para Ella */}
            <View style={styles.joyasMenuLinks}>
              <TouchableOpacity
                style={styles.compromisGenderHeader}
                onMouseEnter={() => setCompromisHover("ella")}
                onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate("/coleccion/compromiso-ella"); }}
              >
                <Text style={[styles.compromisGenderTitle, compromisHover === "ella" && styles.compromisGenderTitleActive]}>
                  PARA ELLA
                </Text>
                <Text style={styles.compromisGenderSub}>○ Para la novia</Text>
              </TouchableOpacity>
              {COMPROMISO_ELLA.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate(`/coleccion/${item.key}`); }}
                >
                  <Text style={styles.joyasMenuLink}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.compromisDivider} />

            {/* Col 2: Para Él */}
            <View style={styles.joyasMenuLinks}>
              <TouchableOpacity
                style={styles.compromisGenderHeader}
                onMouseEnter={() => setCompromisHover("el")}
                onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate("/coleccion/compromiso-el"); }}
              >
                <Text style={[styles.compromisGenderTitle, compromisHover === "el" && styles.compromisGenderTitleActive]}>
                  PARA ÉL
                </Text>
                <Text style={styles.compromisGenderSub}>○ Para el novio</Text>
              </TouchableOpacity>
              {COMPROMISO_EL.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate(`/coleccion/${item.key}`); }}
                >
                  <Text style={styles.joyasMenuLink}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Right: two banner images */}
            <View style={styles.joyasMenuImages}>
              <TouchableOpacity
                style={[styles.compromisBanner, { marginRight: 8 }]}
                onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate("/coleccion/compromiso-ella"); }}
              >
                <View style={styles.compromisBannerOverlay}>
                  <Text style={styles.compromisBannerLabel}>PARA ELLA</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compromisBanner}
                onPress={() => { setCompromisMenuOpen(false); setCompromisHover(null); if (navigate) navigate("/coleccion/compromiso-el"); }}
              >
                <View style={styles.compromisBannerOverlay}>
                  <Text style={styles.compromisBannerLabel}>PARA ÉL</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Search Bar Dropdown - Should appear right after header */}
      {searchOpen && (
        <View
          style={[
            styles.searchBarContainer,
            {
              paddingHorizontal: isSmallScreen ? 15 : 20,
            },
          ]}
        >
          <View style={styles.searchBar} className="searchBar rounded">
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Buscar productos..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.closeSearchButton}
              onPress={() => {
                setSearchOpen(false);
                setSearchQuery("");
                setProductsFiltered([]);
              }}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {/* Display search results */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchResultsContainer}>
              <SearchedProducts
                productsFiltered={productsFiltered}
                onProductPress={(product) => {
                  if (onProductPress) onProductPress(product);
                  setSearchOpen(false);
                  setSearchQuery("");
                  setProductsFiltered([]);
                }}
              />
            </View>
          )}
        </View>
      )}

      {/* Mobile Menu Dropdown */}
      {isSmallScreen && menuOpen && (
        <View style={styles.mobileMenu}>
          {/* Close Button Header */}
          <View style={styles.mobileMenuHeader}>
            <Text style={styles.mobileMenuTitle}>MENÚ</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setMenuOpen(false);
                setSearchOpen(false);
              }}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.mobileMenuItem}
              onPress={() => {
                setMenuOpen(false);
                onNavigate && onNavigate(item.route);
              }}
            >
              <Text style={styles.mobileMenuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.mobileMenuIcons}>
            <TouchableOpacity
              style={styles.mobileIconButton}
              onPress={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
            >
              <Ionicons name="search-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    width: "100%",
    minHeight: 60,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
    flexShrink: 1,
    paddingRight: 10,
  },
  navMenu: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  navItem: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginHorizontal: 15,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  iconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 15,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#c9a962",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#0a0a0a",
    fontSize: 10,
    fontWeight: "800",
  },
  profileIconWrap: {
    position: "relative",
    marginLeft: 4,
  },
  dropdownBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    ...(Platform.OS === "web" && { cursor: "default" }),
  },
  profileDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 6,
    minWidth: 160,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    overflow: "hidden",
  },
  profileDropdownMobile: {
    right: -8,
    minWidth: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  signOutHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  signOutHeaderText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
    marginLeft: 0,
  },
  mobileHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Mobile Menu
  mobileMenu: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: "100%",
  },
  mobileMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  mobileMenuTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: 5,
  },
  mobileMenuItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mobileMenuText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#ffffff",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  mobileMenuIcons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  mobileIconButton: {
    padding: 10,
    marginHorizontal: 15,
  },
  mobileSignOutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Search Bar
  searchBarContainer: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    zIndex: 999,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    padding: 0,
    margin: 0,
  },
  closeSearchButton: {
    padding: 5,
    marginLeft: 10,
  },
  searchResultsContainer: {
    backgroundColor: "#ffffff",
    maxHeight: 400,
    marginTop: 10,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  // Joyas megamenu
  navItemActive: { opacity: 0.75 },
  joyasMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: "#f5f4f2",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }
      : { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }),
  },
  joyasMenuInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 48,
    paddingHorizontal: 80,
    gap: 80,
  },
  joyasMenuLinks: {
    minWidth: 200,
  },
  joyasMenuColHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 2,
    marginBottom: 18,
    fontFamily: "sans-serif",
  },
  joyasMenuLinkActive: { fontWeight: "700", color: "#1a1a1a" },
  joyasMenuLink: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    letterSpacing: 0.4,
    marginBottom: 22,
    fontFamily: "sans-serif",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  joyasMenuImages: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "flex-end",
  },
  joyasMenuImgWrap: {
    width: 220,
    height: 240,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#e8e6e2",
  },
  joyasMenuImg: {
    width: "100%",
    height: "100%",
  },

  // Compromiso megamenu
  compromisGenderHeader: {
    marginBottom: 20,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  compromisGenderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 2,
    marginBottom: 4,
    fontFamily: "sans-serif",
  },
  compromisGenderTitleActive: {
    color: "#9a7c3a",
  },
  compromisGenderSub: {
    fontSize: 12,
    color: "#999",
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: "sans-serif",
  },
  compromisDivider: {
    width: 1,
    backgroundColor: "#e0ddd8",
    alignSelf: "stretch",
    marginHorizontal: 8,
  },
  compromisBanner: {
    width: 200,
    height: 240,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    justifyContent: "flex-end",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  compromisBannerOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  compromisBannerLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "sans-serif",
  },
});

export default Header;
