import SwiftUI
import SwiftData

struct TransactionCalendarView: View {
    @Environment(\.modelContext) private var modelContext
    
    let transactions: [Transaction]
    let onDateSelected: (Date) -> Void
    let onTransactionTapped: (Transaction) -> Void
    
    @State private var selectedDate = Date()
    @State private var currentMonth = Date()
    
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年M月"
        return formatter
    }()
    
    var body: some View {
        VStack(spacing: 0) {
            // Month navigation header
            monthNavigationHeader
            
            // Calendar grid
            calendarGrid
            
            // Selected date transactions
            selectedDateTransactions
        }
    }
    
    private var monthNavigationHeader: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
            .accessibilityLabel("前の月")
            
            Spacer()
            
            Text(dateFormatter.string(from: currentMonth))
                .font(.title2)
                .fontWeight(.semibold)
            
            Spacer()
            
            Button(action: nextMonth) {
                Image(systemName: "chevron.right")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
            .accessibilityLabel("次の月")
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
    
    private var calendarGrid: some View {
        VStack(spacing: 0) {
            // Weekday headers
            HStack(spacing: 0) {
                ForEach(calendar.shortWeekdaySymbols, id: \.self) { weekday in
                    Text(weekday)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
            
            // Calendar days
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 0) {
                ForEach(calendarDays, id: \.self) { date in
                    CalendarDayView(
                        date: date,
                        isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                        isCurrentMonth: calendar.isDate(date, equalTo: currentMonth, toGranularity: .month),
                        transactions: transactionsForDate(date),
                        onTap: {
                            selectedDate = date
                            onDateSelected(date)
                        }
                    )
                }
            }
            .padding(.horizontal)
        }
    }
    
    private var selectedDateTransactions: some View {
        VStack(alignment: .leading, spacing: 0) {
            if !transactionsForDate(selectedDate).isEmpty {
                HStack {
                    Text(DateFormatter.localizedString(from: selectedDate, dateStyle: .full, timeStyle: .none))
                        .font(.headline)
                        .padding(.horizontal)
                        .padding(.top, 16)
                        .padding(.bottom, 8)
                    
                    Spacer()
                    
                    Text("合計: \(totalAmountForDate(selectedDate))")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                        .padding(.top, 16)
                        .padding(.bottom, 8)
                }
                
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(transactionsForDate(selectedDate), id: \.id) { transaction in
                            TransactionRowView(transaction: transaction)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    onTransactionTapped(transaction)
                                }
                                .padding(.horizontal)
                        }
                    }
                    .padding(.bottom, 16)
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    
                    Text("この日に取引はありません")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            }
        }
    }
    
    private var calendarDays: [Date] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: currentMonth) else {
            return []
        }
        
        let monthFirstWeekday = calendar.component(.weekday, from: monthInterval.start)
        let daysToSubtract = monthFirstWeekday - calendar.firstWeekday
        
        guard let startDate = calendar.date(byAdding: .day, value: -daysToSubtract, to: monthInterval.start) else {
            return []
        }
        
        var days: [Date] = []
        var currentDate = startDate
        
        // Generate 42 days (6 weeks) to fill the calendar grid
        for _ in 0..<42 {
            days.append(currentDate)
            guard let nextDate = calendar.date(byAdding: .day, value: 1, to: currentDate) else {
                break
            }
            currentDate = nextDate
        }
        
        return days
    }
    
    private func transactionsForDate(_ date: Date) -> [Transaction] {
        return transactions.filter { transaction in
            calendar.isDate(transaction.date, inSameDayAs: date)
        }.sorted { $0.date > $1.date }
    }
    
    private func totalAmountForDate(_ date: Date) -> String {
        let dayTransactions = transactionsForDate(date)
        let total = dayTransactions.reduce(Decimal(0)) { $0 + $1.amount }
        return CurrencyFormatter.shared.string(from: total)
    }
    
    private func previousMonth() {
        withAnimation(.easeInOut(duration: 0.3)) {
            currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
        }
    }
    
    private func nextMonth() {
        withAnimation(.easeInOut(duration: 0.3)) {
            currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
        }
    }
}

struct CalendarDayView: View {
    let date: Date
    let isSelected: Bool
    let isCurrentMonth: Bool
    let transactions: [Transaction]
    let onTap: () -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        VStack(spacing: 2) {
            Text("\(calendar.component(.day, from: date))")
                .font(.system(size: 16, weight: isSelected ? .bold : .medium))
                .foregroundColor(textColor)
            
            // Transaction indicators
            HStack(spacing: 2) {
                ForEach(Array(transactions.prefix(3).enumerated()), id: \.offset) { index, transaction in
                    ZStack {
                        Circle()
                            .fill(Color(hex: transaction.category?.colorHex ?? "#007AFF"))
                            .frame(width: 4, height: 4)
                        
                        // Shared transaction indicator
                        if transaction.isShared {
                            Circle()
                                .stroke(Color.green, lineWidth: 1)
                                .frame(width: 6, height: 6)
                        }
                    }
                }
                
                if transactions.count > 3 {
                    Text("+")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                }
            }
            .frame(height: 8)
        }
        .frame(width: 40, height: 50)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(backgroundColor)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(borderColor, lineWidth: isSelected ? 2 : 0)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onTap()
        }
        .accessibilityLabel("\(calendar.component(.day, from: date))日")
        .accessibilityValue(transactions.isEmpty ? "取引なし" : "\(transactions.count)件の取引")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
    
    private var textColor: Color {
        if !isCurrentMonth {
            return .secondary
        } else if isSelected {
            return .white
        } else if calendar.isDateInToday(date) {
            return .blue
        } else {
            return .primary
        }
    }
    
    private var backgroundColor: Color {
        if isSelected {
            return .blue
        } else if calendar.isDateInToday(date) {
            return .blue.opacity(0.1)
        } else {
            return .clear
        }
    }
    
    private var borderColor: Color {
        if isSelected {
            return .blue
        } else {
            return .clear
        }
    }
}

#Preview {
    TransactionCalendarView(
        transactions: [],
        onDateSelected: { _ in },
        onTransactionTapped: { _ in }
    )
    .modelContainer(for: Transaction.self, inMemory: true)
}