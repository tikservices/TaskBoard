import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { DragulaService } from 'ng2-dragula/ng2-dragula';

import {
    TopNav,
    ApiResponse,
    Board,
    Column,
    User,
    InlineEdit,
    Modal,
    Notification,
    AuthService,
    ModalService,
    NotificationsService
} from '../shared/index';
import { BoardService } from './board.service';

@Component({
    selector: 'tb-board',
    templateUrl: 'app/board/board.component.html'
})
export class BoardDisplay implements OnInit {
    private activeUser: User;
    private activeBoard: Board;
    private boards: Array<Board>;

    private boardNavId: number;
    private noBoardsMessage: string;

    constructor(private title: Title,
                private router: Router,
                private active: ActivatedRoute,
                private auth: AuthService,
                private modal: ModalService,
                private boardService: BoardService,
                private notes: NotificationsService,
                private dragula: DragulaService) {
        title.setTitle('TaskBoard - Kanban App');
        this.boardNavId = null;

        boardService.getBoards().subscribe((response: ApiResponse) => {
            this.updateBoardsList(response.data[1]);
        });

        auth.userChanged.subscribe((user: User) => {
            this.updateActiveUser(user);
        });

        active.params.subscribe(params => {
            let id = +params['id']; // tslint:disable-line

            this.boardNavId = id ? id : null;
            this.updateActiveBoard();
        });
    }

    ngOnInit(): void {
        if (this.boardNavId) {
            return;
        }

        if (this.activeUser && this.activeUser.default_board_id) {
            this.boardNavId = this.activeUser.default_board_id;
            this.goToBoard();
        }
    }

    goToBoard(): void {
        if (this.boardNavId === null) {
            return;
        }

        this.router.navigate(['/boards/' + this.boardNavId]);
    }

    private updateBoardsList(boards: Array<any>): void {
        let activeBoards: Array<Board> = [];

        boards.forEach((board: any) => {
            let currentBoard = new Board(+board.id, board.name,
                                         board.is_active === '1', board.ownColumn,
                                         board.ownCategory, board.ownAutoAction,
                                         board.ownIssuetracker, board.sharedUser);
            if (currentBoard.is_active) {
                activeBoards.push(currentBoard);
            }
        });

        this.boards = activeBoards;

        this.boards.forEach(board => {
            board.columns.sort((a: Column, b: Column) => {
                return +a.position - +b.position;
            });
        });

        this.updateActiveBoard();
    }

    private updateActiveBoard(): void {
        if (!this.boardNavId || !this.boards) {
            return;
        }

        this.boards.forEach(board => {
            if (board.id === this.boardNavId) {
                this.activeBoard = board;
            }
        });
    }

    private updateActiveUser(activeUser: User) {
        this.activeUser = new User(+activeUser.default_board_id,
                                   activeUser.email,
                                   +activeUser.id,
                                   activeUser.last_login,
                                   +activeUser.security_level,
                                   +activeUser.user_option_id,
                                   activeUser.username,
                                   activeUser.board_access);

        this.noBoardsMessage = 'You are not assigned to any boards. ' +
            'Contact an admin user to be added to a board.';

        if (+activeUser.security_level === 1) {
            this.noBoardsMessage = 'Go to Settings to create a board.';
        }
    }
}

