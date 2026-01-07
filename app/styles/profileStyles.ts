import { StyleSheet } from "react-native";
import { Fonts } from "../constants/theme";

export const makeProfileStyles = (theme: {
    background: string;
    text: string;
    tint: string;
    icon: string;
}) =>
    StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: theme.background,
        },
        container: {
            paddingHorizontal: 20,
        },
        topRow: {
            flexDirection: "row",
            paddingTop: 10,
            paddingBottom: 10,
        },
        header: {
            alignItems: "center",
            paddingVertical: 20,
        },
        avatarRing: {
            width: 130,
            height: 130,
            borderRadius: 65,
            borderWidth: 10,
            borderColor: theme.tint,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
        },
        avatar: {
            width: 122,
            height: 122,
            borderRadius: 65,
            backgroundColor: "#d9d9d9",
        },
        username: {
            fontSize: 28,
            fontWeight: "600",
            marginTop: 4,
            color: theme.text,
        },
        subtle: {
            fontSize: 14,
            color: theme.icon,
            marginTop: 6,
        },
        section: {
            marginTop: 20,
        },
        sectionTitle: {
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 16,
            color: theme.text,
            fontFamily: Fonts?.rounded,
        },
        card: {
            borderWidth: 1,
            borderColor: "#e6e6e6",
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            backgroundColor: theme.background,
        },
        cardTitle: {
            fontSize: 22,
            fontWeight: "900",
            lineHeight: 28,
            color: theme.text,
            fontFamily: Fonts?.rounded,
        },

        cardFooter: {
            marginTop: 12,
            alignItems: "flex-end",
        },

        viewButton: {
            backgroundColor: theme.tint,
            paddingHorizontal: 22,
            paddingVertical: 7,
            borderRadius: 999, //rounded
        },

        viewButtonText: {
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "700",
            fontFamily: Fonts?.rounded,
        },

    });
