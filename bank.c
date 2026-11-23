
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Account {
    int accNo;
    char name[50];
    float balance;
};

struct Account accounts[100];
int count = 0;

// Save accounts to file
void saveData() {
    FILE *fp = fopen("bank.dat", "wb");

    if (fp == NULL) {
        printf("File error!\n");
        return;
    }

    fwrite(&count, sizeof(int), 1, fp);
    fwrite(accounts, sizeof(struct Account), count, fp);

    fclose(fp);
}

// Load accounts from file
void loadData() {
    FILE *fp = fopen("bank.dat", "rb");

    if (fp == NULL)
        return;

    fread(&count, sizeof(int), 1, fp);

    if (count < 0 || count > 100) {
        count = 0;
        fclose(fp);
        return;
    }

    fread(accounts, sizeof(struct Account), count, fp);
    fclose(fp);
}

// Find account
int findAccount(int accNo) {
    int i;

    for (i = 0; i < count; i++) {
        if (accounts[i].accNo == accNo)
            return i;
    }

    return -1;
}

// Create account
void createAccount() {
    if (count >= 100) {
        printf("Account limit reached!\n");
        return;
    }

    int accNo;

    printf("Enter Account Number: ");
    scanf("%d", &accNo);

    if (findAccount(accNo) != -1) {
        printf("Account already exists!\n");
        return;
    }

    accounts[count].accNo = accNo;

    printf("Enter Customer Name: ");
    scanf(" %49[^\n]", accounts[count].name);

    printf("Enter Initial Balance: ");
    scanf("%f", &accounts[count].balance);

    if (accounts[count].balance < 0) {
        printf("Invalid balance!\n");
        return;
    }

    count++;
    saveData();

    printf("\nAccount Created Successfully!\n");
}

// Display accounts
void displayAccounts() {
    int i;

    if (count == 0) {
        printf("No accounts found!\n");
        return;
    }

    printf("\n------ ACCOUNT DETAILS ------\n");

    for (i = 0; i < count; i++) {
        printf("\nAccount Number: %d", accounts[i].accNo);
        printf("\nCustomer Name: %s", accounts[i].name);
        printf("\nBalance: Rs. %.2f\n", accounts[i].balance);
    }
}

// Deposit money
void depositMoney() {
    int accNo, index;
    float amount;

    printf("Enter Account Number: ");
    scanf("%d", &accNo);

    index = findAccount(accNo);

    if (index == -1) {
        printf("Account not found!\n");
        return;
    }

    printf("Enter Deposit Amount: ");
    scanf("%f", &amount);

    if (amount <= 0) {
        printf("Invalid amount!\n");
        return;
    }

    accounts[index].balance += amount;
    saveData();

    printf("Deposit Successful!\n");
    printf("New Balance: Rs. %.2f\n",
           accounts[index].balance);
}

// Withdraw money
void withdrawMoney() {
    int accNo, index;
    float amount;

    printf("Enter Account Number: ");
    scanf("%d", &accNo);

    index = findAccount(accNo);

    if (index == -1) {
        printf("Account not found!\n");
        return;
    }

    printf("Enter Withdrawal Amount: ");
    scanf("%f", &amount);

    if (amount <= 0) {
        printf("Invalid amount!\n");
        return;
    }

    if (amount > accounts[index].balance) {
        printf("Insufficient Balance!\n");
        return;
    }

    accounts[index].balance -= amount;
    saveData();

    printf("Withdrawal Successful!\n");
    printf("Remaining Balance: Rs. %.2f\n",
           accounts[index].balance);
}

// Transfer money
void transferMoney() {
    int from, to, i, j;
    float amount;

    printf("Enter Sender Account Number: ");
    scanf("%d", &from);

    printf("Enter Receiver Account Number: ");
    scanf("%d", &to);

    i = findAccount(from);
    j = findAccount(to);

    if (i == -1 || j == -1 || i == j) {
        printf("Invalid account details!\n");
        return;
    }

    printf("Enter Transfer Amount: ");
    scanf("%f", &amount);

    if (amount <= 0 || amount > accounts[i].balance) {
        printf("Invalid amount or insufficient balance!\n");
        return;
    }

    accounts[i].balance -= amount;
    accounts[j].balance += amount;

    saveData();

    printf("Money Transferred Successfully!\n");
}

// Balance enquiry
void checkBalance() {
    int accNo, index;

    printf("Enter Account Number: ");
    scanf("%d", &accNo);

    index = findAccount(accNo);

    if (index == -1) {
        printf("Account not found!\n");
        return;
    }

    printf("Customer Name: %s\n", accounts[index].name);
    printf("Available Balance: Rs. %.2f\n",
           accounts[index].balance);
}

// Delete account
void deleteAccount() {
    int accNo, index, i;

    printf("Enter Account Number: ");
    scanf("%d", &accNo);

    index = findAccount(accNo);

    if (index == -1) {
        printf("Account not found!\n");
        return;
    }

    if (accounts[index].balance != 0) {
        printf("Cannot delete account with remaining balance!\n");
        return;
    }

    for (i = index; i < count - 1; i++) {
        accounts[i] = accounts[i + 1];
    }

    count--;
    saveData();

    printf("Account Deleted Successfully!\n");
}

// Main function
int main() {
    int choice;

    loadData();

    do {
        printf("\n================================\n");
        printf("      BANKING MANAGEMENT SYSTEM\n");
        printf("================================\n");
        printf("1. Create Account\n");
        printf("2. Display All Accounts\n");
        printf("3. Deposit Money\n");
        printf("4. Withdraw Money\n");
        printf("5. Transfer Money\n");
        printf("6. Check Balance\n");
        printf("7. Delete Account\n");
        printf("8. Exit\n");
        printf("--------------------------------\n");

        printf("Enter Your Choice: ");
        if (scanf("%d", &choice) != 1) {
            printf("Invalid input!\n");
            break;
        }

        switch (choice) {
            case 1:
                createAccount();
                break;

            case 2:
                displayAccounts();
                break;

            case 3:
                depositMoney();
                break;

            case 4:
                withdrawMoney();
                break;

            case 5:
                transferMoney();
                break;

            case 6:
                checkBalance();
                break;

            case 7:
                deleteAccount();
                break;

            case 8:
                printf("Thank you for using our bank!\n");
                break;

            default:
                printf("Invalid Choice!\n");
        }

    } while (choice != 8);

    return 0;
}
