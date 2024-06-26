import React, { useRef, useEffect, useState, Children } from "react";
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  TextProps,
  I18nManager,
  InteractionManager,
} from "react-native";
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

const uniq = (values: string[]) => {
  return values.filter((value, index) => {
    return values.indexOf(value) === index;
  });
};

const range = (length: number) => Array.from({ length }, (x, i) => i);
const splitText = (text = "") => (text + "").split("");
const numberRange = range(10).map((p) => p + "");
const numAdditional = ["-", ",", ".", "k", "M", "G", "T", "P", "E"];
const numberItems = [...numberRange, ...numAdditional];
const isNumber = (v: string) => !isNaN(parseInt(v));

interface Props {
  duration?: number;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  textProps?: TextProps;
  additionalDisplayItems?: string[];
  accessibilityLabel?: string;
  children: React.ReactNode;
}

interface TickProps {
  children: string;
  duration: number;
  textStyle?: TextStyle;
  textProps?: TextProps;
  rotateItems: string[];
  measureMap: MeasureMap;
}

type MeasureMap = Record<string, { width: number; height: number }>;

export const Tick = ({ ...props }: Partial<TickProps>) => {
  //@ts-ignore
  return <TickItem {...props} />;
};

const AnimatedText = Animated.createAnimatedComponent(Text);

const TickItem = ({
  children,
  duration,
  textStyle,
  textProps,
  measureMap,
  rotateItems,
}: TickProps) => {
  const measurement = measureMap[children] || { height: 0, width: 0 };
  const position = useSharedValue(0);

  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      position.value =
        rotateItems.findIndex((p) => p === children) *
        (measurement?.height || 0) *
        -1;
    });

    return () => interactionPromise.cancel();
  }, [children]);

  const randomizer = Math.floor(Math.random() * 2) + 1;
  const widthAnim = useAnimatedStyle(() => {
    return {
      height: withTiming(measurement.height || 0, { duration: 50 }),
      width: withTiming(measurement.width || 0, { duration: 50 }),
    };
  });
  const stylePos = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(position.value, {
            duration: randomizer * duration,
          }),
        },
      ],
    };
  });
  const heightStyle = useAnimatedStyle(() => {
    if (measurement.height) {
      return { height: measurement.height };
    }

    return { height: 0 };
  });

  return (
    <Animated.View style={[{ overflow: "hidden" }, widthAnim]}>
      <Animated.View style={stylePos}>
        {rotateItems.map((v) => (
          <AnimatedText key={v} {...textProps} style={[textStyle, heightStyle]}>
            {v}
          </AnimatedText>
        ))}
      </Animated.View>
    </Animated.View>
  );
};

const Ticker = ({
  duration,
  containerStyle,
  textStyle,
  textProps,
  accessibilityLabel,
  children,
}: Props) => {
  const [measured, setMeasured] = useState<boolean>(false);
  const measureMap = useRef<MeasureMap>({});
  const timeoutRef = useRef(null);

  const measureStrings: string[] = Children.map(children as any, (child) => {
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

  const handleMeasure = (e: any, v: string) => {
    if (!measureMap.current) return;

    measureMap.current[v] = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };

    if (Object.keys(measureMap.current).length === rotateItems.length) {
      timeoutRef.current = setTimeout(() => {
        setMeasured(true);
      }, 1500);
    }
  };

  useEffect(() => {
    return clearTimeout(timeoutRef.current);
  }, []);

  return (
    <View style={[styles.row, containerStyle]} accessibilityLabel={accessibilityLabel}>
      {measured === true ? (
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
        })
      ) : (
        <>
          {children.split("").map((child, index) => {
            let key = (Math.random() + 1).toString(36).substring(7);
            return (
              <Text
                key={key}
                {...textProps}
                style={[textStyle, { paddingHorizontal: 0.15 }]}
              >
                {child.replace(/[0-9]/g, "0")}
              </Text>
            );
          })}
        </>
      )}
      {rotateItems.map((v) => {
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

export default Ticker;
