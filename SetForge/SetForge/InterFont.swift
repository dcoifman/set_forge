//
//  InterFont.swift
//  SetForge
//
//  Created by Daniel Coifman on 5/15/25.
//


import SwiftUI

// Remember to add the "Inter" font to your project and update your Info.plist
// For example:
// Font files: Inter-Regular.ttf, Inter-SemiBold.ttf, Inter-Bold.ttf

struct InterFont: ViewModifier {
    enum FontWeight {
        case regular, semiBold, bold
    }

    var weight: FontWeight
    var size: CGFloat

    func body(content: Content) -> some View {
        switch weight {
        case .regular:
            content.font(.custom("Inter-Regular", size: size))
        case .semiBold:
            content.font(.custom("Inter-SemiBold", size: size))
        case .bold:
            content.font(.custom("Inter-Bold", size: size))
        }
    }
}

extension View {
    func interFont(weight: InterFont.FontWeight = .regular, size: CGFloat = 16) -> some View {
        self.modifier(InterFont(weight: weight, size: size))
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .interFont(weight: .semiBold, size: 16)
            .foregroundColor(.white)
            .background(Color.moltenOrange)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct GlassCardBackground: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 15.0, *) {
            content
                .padding()
                .background(.ultraThinMaterial) // Adapts to light/dark mode
                .cornerRadius(15)
                .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
        } else {
            // Fallback for older iOS versions
            content
                .padding()
                .background(Color.cardBackground.opacity(0.8))
                .cornerRadius(15)
                .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
        }
    }
}

extension View {
    func glassCardStyle() -> some View {
        self.modifier(GlassCardBackground())
    }
}