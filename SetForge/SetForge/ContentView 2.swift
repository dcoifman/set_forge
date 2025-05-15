//
//  ContentView 2.swift
//  SetForge
//
//  Created by Daniel Coifman on 5/15/25.
//


import SwiftUI

struct ContentView: View {
    @State private var athletes = sampleAthletes
    @State private var showingSheet = false // For future use, e.g. add athlete

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 25) {
                    
                    HeaderView()

                    TodayQueueView()
                        .padding(.horizontal)
                    
                    AthleteRosterView(athletes: $athletes)
                        .padding(.horizontal)
                    
                    Spacer() // Pushes content to the top
                }
                .padding(.vertical) // Add some top/bottom padding to the ScrollView content
            }
            .background(Color.deepSlate.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true) // Hide default navigation bar to use custom header
        }
        .accentColor(.moltenOrange) // Sets default tint for navigation links, etc.
        // Apply preferred color scheme if you want to force dark mode
        // .preferredColorScheme(.dark)
    }
}

struct HeaderView: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Welcome Coach!")
                    .interFont(weight: .bold, size: 28)
                    .foregroundColor(.coolSteel)
                Text("Let's shape some champions.")
                    .interFont(size: 16)
                    .foregroundColor(.coolSteel.opacity(0.7))
            }
            Spacer()
            Button {
                // Action for settings or profile
            } label: {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.coolSteel)
            }
        }
        .padding(.horizontal)
        .padding(.top, 10) // Adjust if not using safe area for top
    }
}

struct AthleteRosterView: View {
    @Binding var athletes: [Athlete]
    @State private var navigateToAthlete: Athlete? = nil

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text("Athlete Roster")
                    .interFont(weight: .bold, size: 22)
                    .foregroundColor(.coolSteel)
                Spacer()
                Button {
                    // Action to add new athlete
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.moltenOrange)
                }
            }
            .padding(.bottom, 5)

            LazyVStack(spacing: 12) {
                ForEach(athletes) { athlete in
                    Button(action: {
                        self.navigateToAthlete = athlete
                    }) {
                        AthleteCardView(athlete: athlete)
                    }
                    .buttonStyle(.plain) // Use plain to allow full card tap effect if desired
                }
            }
             // NavigationLink for programmatic navigation (hidden)
            .background(
                NavigationLink(
                    destination: AthleteDetailView(athlete: navigateToAthlete ?? sampleAthletes.first!), // Placeholder detail view
                    tag: navigateToAthlete ?? sampleAthletes.first!, // Default tag to prevent issues
                    selection: $navigateToAthlete,
                    label: { EmptyView() }
                )
                .opacity(0)
            )
        }
    }
}

// Placeholder for where you'd navigate
struct AthleteDetailView: View {
    let athlete: Athlete
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ZStack {
            Color.deepSlate.edgesIgnoringSafeArea(.all)
            VStack {
                Text("Detail View for \(athlete.name)")
                    .interFont(weight: .bold, size: 24)
                    .foregroundColor(.coolSteel)
                
                Spacer()
                
                Button("Go Back") {
                    presentationMode.wrappedValue.dismiss()
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding()
        }
        .navigationTitle(athlete.name)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false) // Ensure back button is shown
        .toolbar { // Custom back button to match theme if needed
             ToolbarItem(placement: .navigationBarLeading) {
                 Button {
                     presentationMode.wrappedValue.dismiss()
                 } label: {
                     Image(systemName: "chevron.backward")
                         .foregroundColor(.moltenOrange)
                     Text("Dashboard")
                         .foregroundColor(.moltenOrange)
                 }
             }
        }
    }
}


struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .preferredColorScheme(.dark) // Preview in dark mode
    }
}