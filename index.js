import React, { useRef, useEffect, useState, Children } from "react";
import { StyleSheet, Text, View, I18nManager } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const styles = StyleSheet.create({
  row: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    overflow: "hidden",
  },
  hide: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
  },
});

const uniq = (values) => {
  return values.filter((value, index) => {
    return values.indexOf(value) === index;
  });
};

const range = (length) => Array.from({ length }, (x, i) => i);
const splitText = (text = "") => (text + "").split("");
const numberRange = range(10).map((p) => p + "");
const numAdditional = [",", "."];
const numberItems = [...numberRange, ...numAdditional];
const isNumber = (v) => !isNaN(parseInt(v));

export const Tick = ({ ...props }) => {
  //@ts-ignore
  return <TickItem {...props} />;
};

const TickItem = ({
  children,
  duration,
  textStyle,
  textProps,
  measureMap,
  rotateItems,
}) => {
  const measurement = measureMap[children];
  const position = useSharedValue(0);

  useEffect(() => {
    position.value =
      rotateItems.findIndex((p) => p === children) * measurement.height * -1;
  }, [children]);

  const randomizer = Math.floor(Math.random() * 4);
  const widthAnim = useAnimatedStyle(() => {
    return {
      height: withTiming(measurement.height, { duration: 50 }),
      width: withTiming(measurement.width, { duration: 50 }),
    };
  });
  const stylePos = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(position.value, {
            duration: 1000 + randomizer * duration,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[{ overflow: "hidden" }, widthAnim]}>
      <Animated.View style={stylePos}>
        {rotateItems.map((v) => (
          <Text
            key={v}
            {...textProps}
            style={[textStyle, { height: measurement.height }]}
          >
            {v}
          </Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
};

const Ticker = ({
  duration = 250,
  containerStyle,
  textStyle,
  textProps,
  children,
}) => {
  const [measured, setMeasured] = useState(false);

  const measureMap = useRef({})
  const measureStrings = Children.map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return splitText(`${child}`);
    } else if (child) {
      return child?.props && child?.props?.rotateItems;
    }
  }).reduce((acc, val) => acc.concat(val), []);

  const hasNumbers = measureStrings.find((v) => isNumber(v)) !== undefined;
  const rotateItems = uniq([
    ...(hasNumbers ? numberItems : []),
    ...measureStrings,
  ]);

  const handleMeasure = (e, v) => {
    if (!measureMap.current) return;

    measureMap.current[v] = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };

    if (Object.keys(measureMap.current).length === rotateItems.length) {
      setMeasured(true);
    }
  };

  return (
    <View style={[styles.row, containerStyle]}>
      {measured === true &&
        Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return splitText(`${child}`).map((text, index) => {
              let items = isNumber(text) ? numberItems : [text];
              return (
                <TickItem
                  key={index}
                  duration={duration}
                  textStyle={textStyle}
                  textProps={textProps}
                  rotateItems={items}
                  measureMap={measureMap.current}
                >
                  {text}
                </TickItem>
              );
            });
          } else {
            console.log("RETURNED CLONED ELEMENT");
            //@ts-ignore
            return React.cloneElement(child, {
              duration,
              textStyle,
              textProps,
              measureMap: measureMap.current,
            });
          }
        })}
      {rotateItems.map((v) => {
        console.log("ROTATE ITEMS");
        return (
          <Text
            key={v}
            {...textProps}
            style={[textStyle, styles.hide]}
            onLayout={(e) => handleMeasure(e, v)}
          >
            {v}
          </Text>
        );
      })}
    </View>
  );
};

// Ticker.defaultProps = {
//   duration: 250,
// };

export default Ticker;
